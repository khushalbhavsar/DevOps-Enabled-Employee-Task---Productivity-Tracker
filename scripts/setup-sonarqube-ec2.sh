#!/bin/bash

################################################################################
# SonarQube Setup Script for AWS EC2 (Amazon Linux 2)
# Instance Requirements: t3.medium or larger (min 2-4GB RAM)
# Security Group: Port 9000 must be open
# User: ec2-user
################################################################################

set -e  # Exit on any error

echo "========================================"
echo "🚀 SonarQube Installation Script"
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

# Configuration - Set your passwords here or via environment variables
POSTGRES_PASSWORD="${SONAR_DB_PASSWORD:-SonarDB@123}"
SONAR_DB_USER="sonar"
SONAR_DB_NAME="sonarqube"

print_warning "⚠️  IMPORTANT: Using default database password. Change SONAR_DB_PASSWORD env var for production!"

# Step 1: Update System
print_info "Step 1: Updating system packages..."
sudo yum update -y
sudo yum install unzip git -y
print_info "✅ System updated successfully"

# Step 2: Install Java 17 (Amazon Corretto)
print_info "Step 2: Installing Java 17..."
sudo yum install java-17-amazon-corretto.x86_64 -y
java --version
print_info "✅ Java 17 installed successfully"

# Step 3: Install PostgreSQL 15
print_info "Step 3: Installing PostgreSQL 15..."
sudo dnf install postgresql15.x86_64 postgresql15-server -y
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_info "✅ PostgreSQL 15 installed successfully"

# Step 4: Configure PostgreSQL for SonarQube
print_info "Step 4: Configuring PostgreSQL database..."

# Set postgres user password
print_info "Setting postgres user password..."
echo "postgres:${POSTGRES_PASSWORD}" | sudo chpasswd

# Create SonarQube database and user
sudo -u postgres psql <<EOF
CREATE USER ${SONAR_DB_USER} WITH ENCRYPTED PASSWORD '${POSTGRES_PASSWORD}';
CREATE DATABASE ${SONAR_DB_NAME} OWNER ${SONAR_DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${SONAR_DB_NAME} TO ${SONAR_DB_USER};
\q
EOF

print_info "✅ PostgreSQL configured successfully"

# Step 5: Download and Install SonarQube
print_info "Step 5: Downloading SonarQube..."
cd /opt
sudo wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-10.6.0.92116.zip
sudo unzip sonarqube-10.6.0.92116.zip
sudo mv sonarqube-10.6.0.92116 sonarqube
sudo rm -f sonarqube-10.6.0.92116.zip
print_info "✅ SonarQube downloaded and extracted"

# Step 6: System Tuning
print_info "Step 6: Applying system tuning for SonarQube..."

# Increase vm.max_map_count
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Increase file limits
sudo tee -a /etc/security/limits.conf <<EOF
sonar   -   nofile   65536
sonar   -   nproc    4096
EOF

print_info "✅ System tuning applied"

# Step 7: Create sonar user and set permissions
print_info "Step 7: Creating sonar user and setting permissions..."
sudo useradd -r -s /bin/false sonar
sudo chown -R sonar:sonar /opt/sonarqube
sudo chmod -R 755 /opt/sonarqube/bin/
sudo chmod +x /opt/sonarqube/bin/linux-x86-64/sonar.sh
print_info "✅ User and permissions configured"

# Step 8: Configure SonarQube
print_info "Step 8: Configuring SonarQube database connection..."

# Backup original config
sudo cp /opt/sonarqube/conf/sonar.properties /opt/sonarqube/conf/sonar.properties.bak

# Update database configuration
sudo tee -a /opt/sonarqube/conf/sonar.properties <<EOF

# Database Configuration
sonar.jdbc.username=${SONAR_DB_USER}
sonar.jdbc.password=${POSTGRES_PASSWORD}
sonar.jdbc.url=jdbc:postgresql://localhost:5432/${SONAR_DB_NAME}

# Web Server Configuration
sonar.web.host=0.0.0.0
sonar.web.port=9000
EOF

print_info "✅ SonarQube configured"

# Step 9: Create systemd service
print_info "Step 9: Creating SonarQube systemd service..."

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

print_info "✅ Systemd service created"

# Step 10: Start SonarQube
print_info "Step 10: Starting SonarQube service..."
sudo systemctl daemon-reload
sudo systemctl reset-failed sonarqube 2>/dev/null || true
sudo systemctl start sonarqube
sudo systemctl enable sonarqube

print_info "Waiting for SonarQube to start (60 seconds)..."
sleep 60

sudo systemctl status sonarqube --no-pager -l
print_info "✅ SonarQube service started"

# Step 11: Install Sonar Scanner CLI
print_info "Step 11: Installing Sonar Scanner CLI..."
cd /opt
sudo wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.3.0.5189-linux-x64.zip
sudo unzip sonar-scanner-cli-7.3.0.5189-linux-x64.zip
sudo mv sonar-scanner-7.3.0.5189-linux-x64 sonar-scanner
sudo rm -f sonar-scanner-cli-7.3.0.5189-linux-x64.zip

# Add to PATH
echo 'export PATH=$PATH:/opt/sonar-scanner/bin' >> ~/.bashrc
export PATH=$PATH:/opt/sonar-scanner/bin

sonar-scanner --version
print_info "✅ Sonar Scanner installed"

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<EC2-Public-IP>")

# Final Instructions
echo ""
echo "========================================"
echo "✅ SONARQUBE INSTALLATION COMPLETED!"
echo "========================================"
echo ""
echo "📋 Access SonarQube:"
echo "   URL: http://${PUBLIC_IP}:9000"
echo ""
echo "📋 Default Login Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo "   (You will be prompted to change on first login)"
echo ""
echo "📋 Database Configuration:"
echo "   Database: ${SONAR_DB_NAME}"
echo "   User: ${SONAR_DB_USER}"
echo "   Password: ${POSTGRES_PASSWORD}"
echo ""
echo "📋 Useful Commands:"
echo "   Check Status:  sudo systemctl status sonarqube"
echo "   Restart:       sudo systemctl restart sonarqube"
echo "   Stop:          sudo systemctl stop sonarqube"
echo "   Logs:          tail -f /opt/sonarqube/logs/sonar.log"
echo "   Web Logs:      tail -f /opt/sonarqube/logs/web.log"
echo ""
echo "📋 Next Steps:"
echo "   1. Access SonarQube web interface"
echo "   2. Login and change admin password"
echo "   3. Generate authentication token for CI/CD"
echo "   4. Configure your projects"
echo ""
echo "========================================"
print_warning "⚠️  IMPORTANT: Change default passwords in production!"
echo "========================================"
