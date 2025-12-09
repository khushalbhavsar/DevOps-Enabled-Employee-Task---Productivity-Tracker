#!/bin/bash

################################################################################
# All-in-One DevOps Stack Setup Script for AWS EC2
# Installs: Jenkins + SonarQube + Grafana + Prometheus + Node Exporter
# Instance Requirements: t3.xlarge or larger (min 16GB RAM recommended)
# Security Group Ports: 22, 8080, 9000, 3000, 9090, 9100
# User: ec2-user
################################################################################

set -e  # Exit on any error

echo "========================================"
echo "🚀 All-in-One DevOps Stack Installation"
echo "   - Jenkins"
echo "   - SonarQube"
echo "   - Grafana"
echo "   - Prometheus"
echo "   - Node Exporter"
echo "========================================"
echo ""
echo "⚠️  This installation requires:"
echo "   - EC2 Instance: t3.xlarge or larger"
echo "   - RAM: 16GB minimum"
echo "   - Ports: 22, 8080, 9000, 3000, 9090, 9100"
echo ""
read -p "Press Enter to continue or CTRL+C to cancel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

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
SONAR_DB_PASSWORD="${SONAR_DB_PASSWORD:-SonarDB@123}"
GRAFANA_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-Admin@123}"
GIT_USER_NAME="${GIT_USER_NAME:-DevOps User}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-devops@example.com}"

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<EC2-Public-IP>")

# Start time
START_TIME=$(date +%s)

################################################################################
# COMMON DEPENDENCIES
################################################################################

print_section "📦 Installing Common Dependencies"

sudo yum update -y
sudo yum install wget tar tree unzip git make -y

print_info "✅ Common dependencies installed"

################################################################################
# INSTALL JENKINS
################################################################################

print_section "🔧 Installing Jenkins Stack"

# Install Docker
print_info "Installing Docker..."
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
docker --version

# Install Maven
print_info "Installing Maven..."
sudo yum install maven -y
mvn -v

# Configure Git
print_info "Configuring Git..."
git config --global user.name "${GIT_USER_NAME}"
git config --global user.email "${GIT_USER_EMAIL}"

# Install Java 21 for Jenkins (Amazon Linux 2023 compatible)
print_info "Installing Java 21 (Amazon Corretto)..."
sudo yum install java-21-amazon-corretto -y
java --version

# Install Jenkins
print_info "Installing Jenkins..."
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
sudo yum install fontconfig -y
sudo yum install jenkins -y
sudo systemctl daemon-reload

# Start Jenkins
print_info "Starting Jenkins..."
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Configure Jenkins for Docker
print_info "Configuring Jenkins for Docker..."
sudo usermod -aG docker jenkins
sudo systemctl restart docker
sudo systemctl restart jenkins

print_info "✅ Jenkins installation completed"

################################################################################
# INSTALL SONARQUBE
################################################################################

print_section "🔍 Installing SonarQube Stack"

# Install Java 17 for SonarQube
print_info "Installing Java 17 (Amazon Corretto)..."
sudo yum install java-17-amazon-corretto.x86_64 -y

# Install PostgreSQL 15
print_info "Installing PostgreSQL 15..."
sudo dnf install postgresql15.x86_64 postgresql15-server -y
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL
print_info "Configuring PostgreSQL database..."
echo "postgres:${SONAR_DB_PASSWORD}" | sudo chpasswd

sudo -u postgres psql <<EOF
CREATE USER sonar WITH ENCRYPTED PASSWORD '${SONAR_DB_PASSWORD}';
CREATE DATABASE sonarqube OWNER sonar;
GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonar;
\q
EOF

# Download and install SonarQube
print_info "Downloading SonarQube..."
cd /opt
sudo wget -q https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-10.6.0.92116.zip
sudo unzip -q sonarqube-10.6.0.92116.zip
sudo mv sonarqube-10.6.0.92116 sonarqube
sudo rm -f sonarqube-10.6.0.92116.zip

# System tuning
print_info "Applying system tuning..."
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

sudo tee -a /etc/security/limits.conf <<EOF
sonar   -   nofile   65536
sonar   -   nproc    4096
EOF

# Create sonar user
print_info "Creating sonar user..."
sudo useradd -r -s /bin/false sonar
sudo chown -R sonar:sonar /opt/sonarqube
sudo chmod -R 755 /opt/sonarqube/bin/
sudo chmod +x /opt/sonarqube/bin/linux-x86-64/sonar.sh

# Configure SonarQube
print_info "Configuring SonarQube..."
sudo cp /opt/sonarqube/conf/sonar.properties /opt/sonarqube/conf/sonar.properties.bak

sudo tee -a /opt/sonarqube/conf/sonar.properties <<EOF

# Database Configuration
sonar.jdbc.username=sonar
sonar.jdbc.password=${SONAR_DB_PASSWORD}
sonar.jdbc.url=jdbc:postgresql://localhost:5432/sonarqube

# Web Server Configuration
sonar.web.host=0.0.0.0
sonar.web.port=9000
EOF

# Create systemd service
print_info "Creating SonarQube systemd service..."
sudo tee /etc/systemd/system/sonarqube.service <<EOF
[Unit]
Description=SonarQube Service
After=network.target

[Service]
Type=forking
User=sonar
Group=sonar
LimitNOFILE=65536
LimitNPROC=4096
Environment="JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto.x86_64"
Environment="PATH=/usr/lib/jvm/java-17-amazon-corretto.x86_64/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/opt/sonarqube/bin/linux-x86-64/sonar.sh start
ExecStop=/opt/sonarqube/bin/linux-x86-64/sonar.sh stop
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start SonarQube
print_info "Starting SonarQube..."
sudo systemctl daemon-reload
sudo systemctl reset-failed sonarqube 2>/dev/null || true
sudo systemctl start sonarqube
sudo systemctl enable sonarqube

# Install Sonar Scanner
print_info "Installing Sonar Scanner CLI..."
cd /opt
sudo wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.3.0.5189-linux-x64.zip
sudo unzip -q sonar-scanner-cli-7.3.0.5189-linux-x64.zip
sudo mv sonar-scanner-7.3.0.5189-linux-x64 sonar-scanner
sudo rm -f sonar-scanner-cli-7.3.0.5189-linux-x64.zip

echo 'export PATH=$PATH:/opt/sonar-scanner/bin' >> ~/.bashrc
export PATH=$PATH:/opt/sonar-scanner/bin

print_info "✅ SonarQube installation completed"

################################################################################
# INSTALL MONITORING STACK
################################################################################

print_section "📊 Installing Monitoring Stack"

# Install Grafana
print_info "Installing Grafana..."
sudo yum install -y https://dl.grafana.com/enterprise/release/grafana-enterprise-11.4.0-1.x86_64.rpm
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Install Prometheus
print_info "Installing Prometheus..."
cd ~
wget -q https://github.com/prometheus/prometheus/releases/download/v3.0.1/prometheus-3.0.1.linux-amd64.tar.gz
tar -xzf prometheus-3.0.1.linux-amd64.tar.gz
mv prometheus-3.0.1.linux-amd64 prometheus

sudo useradd --no-create-home --shell /bin/false prometheus

cd prometheus
sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo cp -r consoles/ console_libraries/ /etc/prometheus/
sudo cp prometheus.yml /etc/prometheus/

sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /usr/local/bin/prometheus /usr/local/bin/promtool

# Create Prometheus service
print_info "Creating Prometheus systemd service..."
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

# Install Node Exporter
print_info "Installing Node Exporter..."
cd ~
wget -q https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xzf node_exporter-1.8.2.linux-amd64.tar.gz
cd node_exporter-1.8.2.linux-amd64

sudo cp node_exporter /usr/local/bin
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create Node Exporter service
print_info "Creating Node Exporter systemd service..."
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

# Configure Prometheus
print_info "Configuring Prometheus..."
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

  - job_name: 'jenkins'
    metrics_path: '/prometheus'
    static_configs:
      - targets: ['localhost:8080']
EOF

# Create alert rules
print_info "Creating Prometheus alert rules..."
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

sudo chown -R prometheus:prometheus /etc/prometheus/

# Start monitoring services
print_info "Starting monitoring services..."
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

print_info "✅ Monitoring stack installation completed"

################################################################################
# WAIT FOR SERVICES TO START
################################################################################

print_section "⏳ Waiting for Services to Initialize"

print_info "Waiting for Jenkins to start (30 seconds)..."
sleep 30

print_info "Waiting for SonarQube to start (60 seconds)..."
sleep 60

print_info "Waiting for monitoring services (10 seconds)..."
sleep 10

################################################################################
# VERIFY INSTALLATIONS
################################################################################

print_section "✅ Verifying All Services"

echo ""
echo "Service Status:"
echo "---------------"
sudo systemctl is-active jenkins && echo "✅ Jenkins: Running" || echo "❌ Jenkins: Failed"
sudo systemctl is-active sonarqube && echo "✅ SonarQube: Running" || echo "❌ SonarQube: Failed"
sudo systemctl is-active grafana-server && echo "✅ Grafana: Running" || echo "❌ Grafana: Failed"
sudo systemctl is-active prometheus && echo "✅ Prometheus: Running" || echo "❌ Prometheus: Failed"
sudo systemctl is-active node_exporter && echo "✅ Node Exporter: Running" || echo "❌ Node Exporter: Failed"

################################################################################
# FINAL OUTPUT
################################################################################

# Calculate installation time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
print_section "🎉 ALL-IN-ONE DEVOPS STACK INSTALLATION COMPLETED!"

cat <<EOF

════════════════════════════════════════════════════════════════
                    🚀 INSTALLATION SUMMARY
════════════════════════════════════════════════════════════════

⏱️  Installation Time: ${MINUTES}m ${SECONDS}s
🌐 Public IP: ${PUBLIC_IP}

════════════════════════════════════════════════════════════════
                    📋 ACCESS INFORMATION
════════════════════════════════════════════════════════════════

🔧 JENKINS
   URL:      http://${PUBLIC_IP}:8080
   Password: $(sudo cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || echo "Check manually")

🔍 SONARQUBE
   URL:      http://${PUBLIC_IP}:9000
   Username: admin
   Password: admin (change on first login)
   DB Password: ${SONAR_DB_PASSWORD}

📊 GRAFANA
   URL:      http://${PUBLIC_IP}:3000
   Username: admin
   Password: admin (change on first login)

📈 PROMETHEUS
   URL:      http://${PUBLIC_IP}:9090
   Targets:  http://${PUBLIC_IP}:9090/targets
   Alerts:   http://${PUBLIC_IP}:9090/alerts

📉 NODE EXPORTER
   Metrics:  http://${PUBLIC_IP}:9100/metrics

════════════════════════════════════════════════════════════════
                    🔧 USEFUL COMMANDS
════════════════════════════════════════════════════════════════

Check All Services:
  sudo systemctl status jenkins sonarqube grafana-server prometheus node_exporter

View Logs:
  Jenkins:      sudo journalctl -u jenkins -f
  SonarQube:    tail -f /opt/sonarqube/logs/sonar.log
  Grafana:      sudo journalctl -u grafana-server -f
  Prometheus:   sudo journalctl -u prometheus -f

Restart Services:
  sudo systemctl restart jenkins
  sudo systemctl restart sonarqube
  sudo systemctl restart grafana-server
  sudo systemctl restart prometheus
  sudo systemctl restart node_exporter

════════════════════════════════════════════════════════════════
                    📋 NEXT STEPS
════════════════════════════════════════════════════════════════

1. JENKINS:
   - Access http://${PUBLIC_IP}:8080
   - Enter initial admin password
   - Install suggested plugins + Docker, SonarQube Scanner, Blue Ocean
   - Create admin user

2. SONARQUBE:
   - Access http://${PUBLIC_IP}:9000
   - Login with admin/admin
   - Change admin password
   - Generate authentication token: My Account → Security → Generate Token

3. GRAFANA:
   - Access http://${PUBLIC_IP}:3000
   - Login with admin/admin
   - Change admin password
   - Add Prometheus data source: http://localhost:9090
   - Import dashboards: 1860, 11074, 405

4. JENKINS + SONARQUBE INTEGRATION:
   - In Jenkins: Manage Jenkins → Configure System
   - Add SonarQube server with token
   - Configure webhooks in SonarQube

5. CONFIGURE ALERTS:
   - In Grafana: Alerting → Notification channels
   - Configure email, Slack, or other channels

════════════════════════════════════════════════════════════════
                    ⚠️  SECURITY REMINDERS
════════════════════════════════════════════════════════════════

⚠️  Change all default passwords immediately!
⚠️  Configure firewall/security groups properly
⚠️  Enable HTTPS for production use
⚠️  Regular backups of:
     - /var/lib/jenkins/
     - PostgreSQL database (sonarqube)
     - /var/lib/grafana/
     - /var/lib/prometheus/

════════════════════════════════════════════════════════════════

🎉 Installation Complete! Happy DevOps-ing! 🎉

════════════════════════════════════════════════════════════════

EOF
