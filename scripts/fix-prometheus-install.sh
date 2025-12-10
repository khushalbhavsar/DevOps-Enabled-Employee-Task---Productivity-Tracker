#!/bin/bash

################################################################################
# Fix Prometheus Installation Script
# Run this if the all-in-one installation failed during Prometheus setup
################################################################################

set -e

echo "========================================"
echo "🔧 Fixing Prometheus Installation"
echo "========================================"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<EC2-Public-IP>")

# Clean up any partial installation
print_info "Cleaning up any partial Prometheus installation..."
sudo systemctl stop prometheus 2>/dev/null || true
sudo rm -rf ~/prometheus
sudo rm -f ~/prometheus-*.tar.gz

# Install Prometheus
print_info "Installing Prometheus..."
cd ~
wget -q https://github.com/prometheus/prometheus/releases/download/v3.0.1/prometheus-3.0.1.linux-amd64.tar.gz
tar -xzf prometheus-3.0.1.linux-amd64.tar.gz
mv prometheus-3.0.1.linux-amd64 prometheus

# Create Prometheus user if doesn't exist
print_info "Creating Prometheus user..."
sudo useradd --no-create-home --shell /bin/false prometheus 2>/dev/null || true

cd prometheus
print_info "Copying Prometheus binaries..."
sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/
sudo mkdir -p /etc/prometheus /var/lib/prometheus

# Copy console files if they exist
if [ -d "consoles" ]; then
    print_info "Copying console files..."
    sudo cp -r consoles /etc/prometheus/
fi
if [ -d "console_libraries" ]; then
    print_info "Copying console library files..."
    sudo cp -r console_libraries /etc/prometheus/
fi

sudo cp prometheus.yml /etc/prometheus/

print_info "Setting permissions..."
sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /usr/local/bin/prometheus /usr/local/bin/promtool

# Create Prometheus service
print_info "Creating Prometheus systemd service..."
sudo tee /etc/systemd/system/prometheus.service > /dev/null <<'EOF'
[Unit]
Description=Prometheus Monitoring
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF

# Install Node Exporter
print_info "Installing Node Exporter..."
cd ~
sudo systemctl stop node_exporter 2>/dev/null || true
sudo rm -rf ~/node_exporter-*
wget -q https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xzf node_exporter-1.8.2.linux-amd64.tar.gz
cd node_exporter-1.8.2.linux-amd64

sudo cp node_exporter /usr/local/bin
sudo useradd --no-create-home --shell /bin/false node_exporter 2>/dev/null || true
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create Node Exporter service
print_info "Creating Node Exporter systemd service..."
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<'EOF'
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

# Configure Prometheus
print_info "Configuring Prometheus..."
sudo tee /etc/prometheus/prometheus.yml > /dev/null <<'EOF'
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

  - job_name: 'jenkins'
    static_configs:
      - targets: ['localhost:8080']

  - job_name: 'sonarqube'
    static_configs:
      - targets: ['localhost:9000']
EOF

# Configure Alert Rules
print_info "Configuring alert rules..."
sudo tee /etc/prometheus/alert_rules.yml > /dev/null <<'EOF'
groups:
  - name: node_alerts
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% (current value: {{ $value }}%)"

      - alert: HighMemoryUsage
        expr: 100 * (1 - ((node_memory_MemAvailable_bytes) / (node_memory_MemTotal_bytes))) > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% (current value: {{ $value }}%)"

      - alert: DiskSpaceLow
        expr: 100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"}) > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is low"
          description: "Disk usage is above 80% (current value: {{ $value }}%)"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} is down"
EOF

sudo chown prometheus:prometheus /etc/prometheus/alert_rules.yml
sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml

# Start services
print_info "Starting Prometheus and Node Exporter..."
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

# Wait a bit for services to start
sleep 5

echo ""
echo "========================================"
echo "✅ Prometheus Installation Fixed!"
echo "========================================"
echo ""
echo "Service Status:"
echo "  Prometheus:    $(sudo systemctl is-active prometheus)"
echo "  Node Exporter: $(sudo systemctl is-active node_exporter)"
echo "  Grafana:       $(sudo systemctl is-active grafana-server)"
echo "  Jenkins:       $(sudo systemctl is-active jenkins)"
echo "  SonarQube:     $(sudo systemctl is-active sonarqube)"
echo ""
echo "Access URLs:"
echo "  Prometheus:    http://${PUBLIC_IP}:9090"
echo "  Node Exporter: http://${PUBLIC_IP}:9100/metrics"
echo "  Grafana:       http://${PUBLIC_IP}:3000 (admin/Admin@123)"
echo "  Jenkins:       http://${PUBLIC_IP}:8080"
echo "  SonarQube:     http://${PUBLIC_IP}:9000 (admin/admin)"
echo ""
echo "Popular Grafana Dashboard IDs:"
echo "  1860  - Node Exporter Full"
echo "  11074 - Node Exporter for Prometheus"
echo "  405   - Node Exporter Server Metrics"
echo ""
echo "Next Steps:"
echo "1. Login to Grafana at http://${PUBLIC_IP}:3000"
echo "2. Add Prometheus as data source (http://localhost:9090)"
echo "3. Import dashboards using IDs above"
echo "4. Check all services: systemctl status <service-name>"
echo "========================================"
