#!/bin/bash

################################################################################
# Grafana + Prometheus + Node Exporter Setup Script for AWS EC2
# Instance Requirements: t3.medium or larger
# Security Group: Ports 3000 (Grafana), 9090 (Prometheus), 9100 (Node Exporter)
# User: ec2-user
################################################################################

set -e  # Exit on any error

echo "========================================"
echo "🚀 Monitoring Stack Installation Script"
echo "   - Grafana"
echo "   - Prometheus"
echo "   - Node Exporter"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
GRAFANA_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-Admin@123}"

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<EC2-Public-IP>")

################################################################################
# STEP 1: INSTALL GRAFANA
################################################################################

print_info "Step 1: Installing Grafana Server..."
sudo yum update -y
sudo yum install wget tar make -y

# Download and install Grafana
sudo yum install -y https://dl.grafana.com/enterprise/release/grafana-enterprise-11.4.0-1.x86_64.rpm

# Start and enable Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Verify installation
grafana-server --version
print_info "✅ Grafana installed successfully"

################################################################################
# STEP 2: INSTALL PROMETHEUS
################################################################################

print_info "Step 2: Installing Prometheus..."

# Download Prometheus
cd ~
wget https://github.com/prometheus/prometheus/releases/download/v3.0.1/prometheus-3.0.1.linux-amd64.tar.gz
tar -xvf prometheus-3.0.1.linux-amd64.tar.gz
mv prometheus-3.0.1.linux-amd64 prometheus

# Create Prometheus user
sudo useradd --no-create-home --shell /bin/false prometheus

# Move binaries and set permissions
cd prometheus
sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo cp -r consoles/ console_libraries/ /etc/prometheus/
sudo cp prometheus.yml /etc/prometheus/

sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /usr/local/bin/prometheus /usr/local/bin/promtool

# Create Prometheus systemd service
sudo tee /etc/systemd/system/prometheus.service <<EOF
[Unit]
Description=Prometheus Monitoring
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \\
  --config.file=/etc/prometheus/prometheus.yml \\
  --storage.tsdb.path=/var/lib/prometheus \\
  --web.console.templates=/etc/prometheus/consoles \\
  --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF

# Start and enable Prometheus
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus

print_info "✅ Prometheus installed successfully"

################################################################################
# STEP 3: INSTALL NODE EXPORTER
################################################################################

print_info "Step 3: Installing Node Exporter..."

# Download Node Exporter
cd ~
wget https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xvf node_exporter-1.8.2.linux-amd64.tar.gz
cd node_exporter-1.8.2.linux-amd64

# Move binary and create user
sudo cp node_exporter /usr/local/bin
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create Node Exporter service
sudo tee /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Start and enable Node Exporter
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

print_info "✅ Node Exporter installed successfully"

################################################################################
# STEP 4: CONFIGURE PROMETHEUS
################################################################################

print_info "Step 4: Configuring Prometheus with Node Exporter..."

# Create Prometheus configuration
sudo tee /etc/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF

sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml

print_info "✅ Prometheus configured"

################################################################################
# STEP 5: CONFIGURE ALERT RULES
################################################################################

print_info "Step 5: Creating Prometheus alert rules..."

sudo tee /etc/prometheus/alert_rules.yml <<EOF
groups:
  - name: node_alerts
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 30% (current value: {{ \$value }}%)"

      - alert: HighMemoryUsage
        expr: 100 * (1 - ((node_memory_MemAvailable_bytes) / (node_memory_MemTotal_bytes))) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80% (current value: {{ \$value }}%)"

      - alert: DiskSpaceLow
        expr: 100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"}) > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is low"
          description: "Disk usage is above 80% (current value: {{ \$value }}%)"

      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instance is down"
          description: "{{ \$labels.instance }} is down"
EOF

sudo chown prometheus:prometheus /etc/prometheus/alert_rules.yml

print_info "✅ Alert rules configured"

# Restart Prometheus to apply changes
sudo systemctl restart prometheus

################################################################################
# STEP 6: VERIFY INSTALLATIONS
################################################################################

print_info "Step 6: Verifying all services..."

sleep 5

echo ""
echo "Service Status:"
echo "---------------"
sudo systemctl status grafana-server --no-pager | grep Active
sudo systemctl status prometheus --no-pager | grep Active
sudo systemctl status node_exporter --no-pager | grep Active

################################################################################
# FINAL OUTPUT
################################################################################

echo ""
echo "========================================"
echo "✅ MONITORING STACK INSTALLATION COMPLETED!"
echo "========================================"
echo ""
echo "📊 Access Grafana:"
echo "   URL: http://${PUBLIC_IP}:3000"
echo "   Username: admin"
echo "   Password: admin (change on first login)"
echo ""
echo "📈 Access Prometheus:"
echo "   URL: http://${PUBLIC_IP}:9090"
echo "   Targets: http://${PUBLIC_IP}:9090/targets"
echo "   Alerts: http://${PUBLIC_IP}:9090/alerts"
echo ""
echo "📉 Node Exporter Metrics:"
echo "   URL: http://${PUBLIC_IP}:9100/metrics"
echo ""
echo "========================================"
echo "📋 Popular Grafana Dashboards to Import:"
echo "   1860  - Node Exporter Full"
echo "   11074 - Node Exporter for Prometheus Dashboard"
echo "   405   - Node Exporter Server Metrics"
echo ""
echo "📋 Useful Commands:"
echo "   Grafana Status:       sudo systemctl status grafana-server"
echo "   Prometheus Status:    sudo systemctl status prometheus"
echo "   Node Exporter Status: sudo systemctl status node_exporter"
echo ""
echo "   Restart Grafana:      sudo systemctl restart grafana-server"
echo "   Restart Prometheus:   sudo systemctl restart prometheus"
echo "   Restart Node Exporter: sudo systemctl restart node_exporter"
echo ""
echo "   Grafana Logs:         sudo journalctl -u grafana-server -f"
echo "   Prometheus Logs:      sudo journalctl -u prometheus -f"
echo ""
echo "📋 Next Steps:"
echo "   1. Access Grafana at http://${PUBLIC_IP}:3000"
echo "   2. Login and change admin password"
echo "   3. Add Prometheus as data source:"
echo "      - URL: http://localhost:9090"
echo "   4. Import dashboard 1860 for Node Exporter metrics"
echo "   5. Configure alert notification channels"
echo ""
echo "========================================"
echo "🎉 Setup Complete!"
echo "========================================"
