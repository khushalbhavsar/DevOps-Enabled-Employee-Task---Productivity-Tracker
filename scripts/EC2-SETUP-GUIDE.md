# EC2 Setup Guide: Jenkins, SonarQube, Grafana-Prometheus-Node Exporter

This guide provides comprehensive instructions for setting up a complete DevOps toolchain on AWS EC2 instances running Amazon Linux 2 or Amazon Linux 2023.

## 📋 Table of Contents
1. [All-in-One Installation](#all-in-one-installation) ⚡ **NEW**
2. [Jenkins Setup](#jenkins-setup)
3. [SonarQube Setup](#sonarqube-setup)
4. [Grafana-Prometheus-Node Exporter Setup](#grafana-prometheus-node-exporter-setup)
5. [CPU Stress Testing](#cpu-stress-testing)
6. [Available Scripts](#available-scripts)
7. [Troubleshooting](#troubleshooting-tips)

---

## All-in-One Installation

### 🚀 Complete DevOps Stack in One Command

Install Jenkins, SonarQube, Grafana, Prometheus, and Node Exporter with a single script.

#### Instance Requirements
- **EC2 Type**: t3.xlarge or larger (recommended for all services)
- **RAM**: 16GB minimum
- **Storage**: 30GB+ recommended
- **SG Ports**: 22, 8080 (Jenkins), 9000 (SonarQube), 3000 (Grafana), 9090 (Prometheus), 9100 (Node Exporter)
- **OS**: Amazon Linux 2023

#### Quick Installation

```bash
# Download and run directly from GitHub
curl -o setup-all-in-one-ec2.sh https://raw.githubusercontent.com/khushalbhavsar/DevOps-Enabled-Employee-Task---Productivity-Tracker/main/scripts/setup-all-in-one-ec2.sh

chmod +x setup-all-in-one-ec2.sh
./setup-all-in-one-ec2.sh
```

**Environment Variables (Optional):**
```bash
export SONAR_DB_PASSWORD="YourSecurePassword"
export GRAFANA_ADMIN_PASSWORD="YourSecurePassword"
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="your.email@example.com"
```

#### Installation Time
Approximately **15-20 minutes** for complete setup.

#### What Gets Installed

| Service | Port | Default Credentials |
|---------|------|---------------------|
| Jenkins | 8080 | Password shown in console |
| SonarQube | 9000 | admin / admin |
| Grafana | 3000 | admin / Admin@123 |
| Prometheus | 9090 | No authentication |
| Node Exporter | 9100 | Metrics endpoint |

#### If Installation Fails

If the installation fails (especially during Prometheus setup), run the fix script:

```bash
# Download and run the fix script
curl -o fix-prometheus-install.sh https://raw.githubusercontent.com/khushalbhavsar/DevOps-Enabled-Employee-Task---Productivity-Tracker/main/scripts/fix-prometheus-install.sh

chmod +x fix-prometheus-install.sh
./fix-prometheus-install.sh
```

---

## Jenkins Setup

### Jenkins Setup on AWS EC2 (Amazon Linux 2)

#### Instance Details
- **EC2 Type**: t3.large or c7i-flex.large
- **Key**: jenkins.pem
- **SG Inbound Rule**: Port 8080 Enabled
- **User**: ec2-user

#### Quick Setup

**Option 1: Automated Installation** ⚡ (Recommended)

```bash
# Connect to EC2
cd ~/Downloads
chmod 400 jenkins.pem
ssh -i "jenkins.pem" ec2-user@<EC2-PUBLIC-IP>

# Run the installation script
chmod +x setup-jenkins-ec2.sh

# Optional: Set Git user info (or edit script defaults)
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="your.email@example.com"

./setup-jenkins-ec2.sh
```

The script will automatically:
- ✅ Update system packages
- ✅ Install Git with your configuration
- ✅ Install and configure Docker
- ✅ Install Maven
- ✅ Install Java 21 (Amazon Corretto)
- ✅ Install Jenkins
- ✅ Configure Jenkins to use Docker
- ✅ Display the initial admin password
- ✅ Show access URL with public IP

**Option 2: Manual Installation**

##### Step 1: Connect to EC2
```bash
cd ~/Downloads
chmod 400 jenkins.pem
ssh -i "jenkins.pem" ec2-user@ec2-52-204-224-228.compute-1.amazonaws.com
```

##### Step 2: Install Dependencies
```bash
sudo yum update -y
sudo yum install wget tar tree python -y
```

##### Step 3: Install Git
```bash
sudo yum install git -y
git config --global user.name "khushalbhavsar"
git config --global user.email "khushalbhavsar41@gmail.com"
git config --list
```

##### Step 4: Install Docker
```bash
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo docker login
docker --version
```

##### Step 5: Install Maven
```bash
sudo yum install maven -y
mvn -v
```

##### Step 6: Install Java 21 (Amazon Corretto)
```bash
sudo yum install java-21-amazon-corretto.x86_64 -y
java --version
```

##### Step 7: Install Jenkins
```bash
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

sudo yum upgrade -y
sudo yum install fontconfig java-21-openjdk -y
sudo yum install jenkins -y

sudo systemctl daemon-reload
```

##### Step 8: Start & Enable Jenkins
```bash
sudo systemctl start jenkins
sudo systemctl enable jenkins
jenkins --version
```

##### Step 9: Allow Jenkins to Use Docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart docker
sudo systemctl restart jenkins
```

##### Get Jenkins Setup Password
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

##### Access Jenkins in Browser
1. Open: `http://<EC2-Public-IP>:8080`
2. Paste password
3. Continue Setup
4. Install Suggested Plugins

##### Install Plugins Manually (If missing)
- Docker
- Docker Pipeline
- Blue Ocean
- AWS Credentials Plugin

**Restart Jenkins:**
```bash
sudo systemctl restart jenkins
```

---

## SonarQube Setup

### SonarQube on EC2 — Step-by-Step Guide

#### Prerequisites
- EC2 instance with sudo privileges
- Open port 9000 for SonarQube in the instance/security group
- At least 2–4 GB RAM (more recommended for production)

#### Quick Setup

**Option 1: Automated Installation** ⚡ (Recommended)

```bash
# Run the installation script
chmod +x setup-sonarqube-ec2.sh

# Optional: Set custom database password (recommended for production)
export SONAR_DB_PASSWORD="YourSecurePassword123!"

./setup-sonarqube-ec2.sh
```

**Default Configuration:**
- Database Password: `SonarDB@123` (change via `SONAR_DB_PASSWORD` environment variable)
- Database User: `sonar`
- Database Name: `sonarqube`

The script will automatically:
- ✅ Update system packages
- ✅ Install Java 17 (Amazon Corretto)
- ✅ Install and configure PostgreSQL 15
- ✅ Create SonarQube database and user
- ✅ Download and install SonarQube 10.6.0
- ✅ Apply required system tuning
- ✅ Create and start systemd service
- ✅ Install Sonar Scanner CLI
- ✅ Display access URL with public IP

**Option 2: Manual Installation**

##### 1. Update System & Install Utilities
```bash
sudo yum update -y
sudo dnf update -y
sudo yum install unzip git -y
```

##### 2. Install Java (Amazon Corretto 17)
```bash
sudo yum install java-17-amazon-corretto.x86_64 -y
java --version
```

##### 3. Install PostgreSQL 15 and Initialize DB
```bash
sudo dnf install postgresql15.x86_64 postgresql15-server -y
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

##### 3.1 Set postgres Password and Create Sonar DB/User
```bash
sudo passwd postgres
sudo -i -u postgres psql
```

Inside psql:
```sql
CREATE USER sonar WITH ENCRYPTED PASSWORD 'YOUR_PASSWORD';
CREATE DATABASE sonarqube OWNER sonar;
\q
```

##### 4. Download & Install SonarQube
```bash
cd /opt
sudo wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-10.6.0.92116.zip
sudo unzip sonarqube-10.6.0.92116.zip
sudo mv sonarqube-10.6.0.92116 sonarqube
```

##### 5. System Tuning Required by SonarQube
```bash
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

sudo tee -a /etc/security/limits.conf <<'EOF'
sonar   -   nofile   65536
sonar   -   nproc    4096
EOF
```

##### 6. Create Sonar System User and Set Ownership
```bash
sudo useradd -r -s /bin/false sonar
sudo chown -R sonar:sonar /opt/sonarqube
sudo chmod -R 755 /opt/sonarqube/bin/
sudo chmod +x /opt/sonarqube/bin/linux-x86-64/sonar.sh
```

##### 7. Configure SonarQube to Use PostgreSQL
Edit `/opt/sonarqube/conf/sonar.properties`:

```properties
sonar.jdbc.username=sonar
sonar.jdbc.password=YOUR_PASSWORD
sonar.jdbc.url=jdbc:postgresql://localhost:5432/sonarqube
```

##### 8. Create Systemd Service for SonarQube
Create `/etc/systemd/system/sonarqube.service`:

```ini
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
```

Start SonarQube:
```bash
sudo systemctl daemon-reload
sudo systemctl reset-failed sonarqube
sudo systemctl start sonarqube
sudo systemctl enable sonarqube
sudo systemctl status sonarqube -l
```

##### 9. Verify SonarQube
- Check logs: `/opt/sonarqube/logs/`
- Open `http://<EC2_PUBLIC_IP>:9000` in browser
- Default login: admin/admin

##### 10. Install Sonar Scanner (CLI)
```bash
cd /opt
sudo wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.3.0.5189-linux-x64.zip
sudo unzip sonar-scanner-cli-7.3.0.5189-linux-x64.zip
sudo mv sonar-scanner-7.3.0.5189-linux-x64 sonar-scanner

echo 'export PATH=$PATH:/opt/sonar-scanner/bin' >> ~/.bashrc
source ~/.bashrc
sonar-scanner --version
```

##### 11. Example: Run Analysis from a Project
```bash
export SONAR_HOST_URL=http://<EC2_PUBLIC_IP>:9000
export SONAR_TOKEN=YOUR_TOKEN

sonar-scanner \
  -Dsonar.projectKey=helloworld-python \
  -Dsonar.sources=. \
  -Dsonar.host.url="$SONAR_HOST_URL" \
  -Dsonar.token="$SONAR_TOKEN"
```

#### Quick Setup

**Option 1: Automated Installation** ⚡ (Recommended)

```bash
# Run the installation script
chmod +x setup-monitoring-ec2.sh

# Optional: Set custom Grafana admin password
export GRAFANA_ADMIN_PASSWORD="YourSecurePassword123!"

./setup-monitoring-ec2.sh
```

**Default Configuration:**
- Grafana Admin Password: `Admin@123` (change on first login or via environment variable)
- Prometheus Scrape Interval: `15s`
- Alert Evaluation Interval: `15s`

The script will automatically:
- ✅ Install Grafana Enterprise 12.2.1
- ✅ Install Prometheus 3.5.0
- ✅ Install Node Exporter 1.10.2
- ✅ Configure Prometheus to scrape Node Exporter
- ✅ Set up comprehensive alert rules (CPU, Memory, Disk, Instance Down)
- ✅ Create and start all systemd services
- ✅ Display access URLs with public IP
- ✅ Show popular Grafana dashboard IDs# EC2 Instance Details
- **Instance Type**: t3.medium
- **OS**: Amazon Linux 2

#### Security Group Inbound Rules Required

| Port | Purpose       |
|------|---------------|
| 3000 | Grafana       |
| 9090 | Prometheus    |
| 9100 | Node Exporter |

#### Quick Setup

**Option 1: Automated Installation**
```bash
chmod +x setup-monitoring-ec2.sh
./setup-monitoring-ec2.sh
```

**Option 2: Manual Installation**

##### Step 1: Install Grafana Server

```bash
sudo yum update -y
sudo yum install wget tar make -y
sudo yum install -y https://dl.grafana.com/grafana-enterprise/release/12.2.1/grafana-enterprise_12.2.1_18655849634_linux_amd64.rpm

sudo systemctl start grafana-server
sudo systemctl enable grafana-server
sudo systemctl status grafana-server

grafana-server --version
```

**Access UI in Browser**
- URL: `http://<EC2_PUBLIC_IP>:3000/`
- Username: admin
- Password: admin (change on first login)

##### Step 2: Install Prometheus

```bash
wget https://github.com/prometheus/prometheus/releases/download/v3.5.0/prometheus-3.5.0.linux-amd64.tar.gz
tar -xvf prometheus-3.5.0.linux-amd64.tar.gz
mv prometheus-3.5.0.linux-amd64 prometheus
```

Create Prometheus user:
```bash
sudo useradd --no-create-home --shell /bin/false prometheus
```

Move binaries & set permissions:
```bash
cd prometheus
sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/
sudo mkdir /etc/prometheus /var/lib/prometheus
sudo cp -r consoles/ console_libraries/ /etc/prometheus/
sudo cp prometheus.yml /etc/prometheus/

sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /usr/local/bin/prometheus /usr/local/bin/promtool
```

Create Prometheus systemd service `/etc/systemd/system/prometheus.service`:
```ini
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
```

Enable & start service:
```bash
sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus
sudo systemctl status prometheus
```

**Access**: `http://<EC2_PUBLIC_IP>:9090`

##### Step 3: Install Node Exporter

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.10.2/node_exporter-1.10.2.linux-amd64.tar.gz
tar xvf node_exporter-1.10.2.linux-amd64.tar.gz
cd node_exporter-1.10.2.linux-amd64

sudo cp node_exporter /usr/local/bin
sudo useradd node_exporter --no-create-home --shell /bin/false
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
```

Create service `/etc/systemd/system/node_exporter.service`:
```ini
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
```

Enable service:
```bash
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
sudo systemctl status node_exporter
```

**Verify**: `http://<EC2_PUBLIC_IP>:9100/metrics`

##### Step 4: Add Node Exporter to Prometheus Config

Edit `/etc/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']
```

Restart Prometheus:
```bash
sudo systemctl restart prometheus
```

##### Step 5: Configure Alert Rules

Create `/etc/prometheus/alert_rules.yml`:
```yaml
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
          description: "CPU usage is above 30% (current value: {{ $value }}%)"

      - alert: HighMemoryUsage
        expr: 100 * (1 - ((node_memory_MemAvailable_bytes) / (node_memory_MemTotal_bytes))) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80% (current value: {{ $value }}%)"

      - alert: DiskSpaceLow
        expr: 100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"}) > 80
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is low"
          description: "Disk usage is above 80% (current value: {{ $value }}%)"

      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instance is down"
          description: "{{ $labels.instance }} is down"
```

Update `/etc/prometheus/prometheus.yml`:
```yaml
global:
## CPU Stress Testing

### Purpose
Test monitoring and alerting systems by simulating high CPU load to verify that Prometheus alerts and Grafana dashboards are working correctly.

### Usage

```bash
chmod +x stress-test-cpu.sh
./stress-test-cpu.sh
```

**What it does:**
- Detects all available CPU cores
- Starts an infinite loop on each core to consume CPU
- Displays monitoring instructions
- Runs until you press `CTRL + C`

### Output Example
```
========================================
🔥 CPU Utilization Booster
========================================
This script will increase CPU usage beyond 80%
Press CTRL + C to stop.

Detected CPU Cores: 4

Starting CPU load on all 4 cores...
✅ CPU load started on all 4 cores

Monitoring Instructions:
  - Open another terminal
  - Run: top
  - Or run: htop (if installed)
  - Check Prometheus alerts at: http://<EC2-IP>:9090/alerts
  - Check Grafana dashboards at: http://<EC2-IP>:3000

Press CTRL + C to stop the stress test
========================================
```

---

## Available Scripts

All scripts are located in the `scripts/` directory and are ready to use on Amazon Linux 2 EC2 instances.

### 1. setup-jenkins-ec2.sh
**Purpose:** Automated Jenkins installation and configuration  
**Requirements:** 
- EC2 Type: t3.large or c7i-flex.large
- Port 8080 open in security group

**Environment Variables:**
- `GIT_USER_NAME` - Git username (default: "DevOps User")
- `GIT_USER_EMAIL` - Git email (default: "devops@example.com")

**Usage:**
```bash
chmod +x setup-jenkins-ec2.sh
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="your.email@example.com"
./setup-jenkins-ec2.sh
```

---

### 2. setup-sonarqube-ec2.sh
**Purpose:** Automated SonarQube with PostgreSQL installation  
**Requirements:**
- EC2 Type: t3.medium or larger (min 2-4GB RAM)
- Port 9000 open in security group

**Environment Variables:**
- `SONAR_DB_PASSWORD` - PostgreSQL password (default: "SonarDB@123")

**Usage:**
```bash
chmod +x setup-sonarqube-ec2.sh
export SONAR_DB_PASSWORD="YourSecurePassword"
./setup-sonarqube-ec2.sh
```

---

### 3. setup-monitoring-ec2.sh
**Purpose:** Complete monitoring stack installation (Grafana + Prometheus + Node Exporter)  
**Requirements:**
- EC2 Type: t3.medium or larger
- Ports 3000, 9090, 9100 open in security group

**Environment Variables:**
- `GRAFANA_ADMIN_PASSWORD` - Grafana admin password (default: "Admin@123")

**Features:**
- Installs Grafana Enterprise 12.2.1
- Installs Prometheus 3.5.0 with alerting rules
- Installs Node Exporter 1.10.2
- Configures all integrations automatically

**Usage:**
```bash
chmod +x setup-monitoring-ec2.sh
export GRAFANA_ADMIN_PASSWORD="YourSecurePassword"
./setup-monitoring-ec2.sh
```

---

### 4. stress-test-cpu.sh
**Purpose:** CPU stress testing for monitoring validation  
**Requirements:** Any EC2 instance with monitoring stack

**Usage:**
```bash
chmod +x stress-test-cpu.sh
./stress-test-cpu.sh
# Press CTRL+C to stop
```

---

### 5. setup-all-in-one-ec2.sh ⚡ **NEW**
**Purpose:** Install complete DevOps stack in one command  
**Requirements:**
- EC2 Type: t3.xlarge or larger
- RAM: 16GB minimum
- Ports: 22, 8080, 9000, 3000, 9090, 9100

**Environment Variables:**
- `SONAR_DB_PASSWORD` - SonarQube DB password (default: "SonarDB@123")
- `GRAFANA_ADMIN_PASSWORD` - Grafana admin password (default: "Admin@123")
- `GIT_USER_NAME` - Git username (default: "DevOps User")
- `GIT_USER_EMAIL` - Git email (default: "devops@example.com")

**Installs:**
- Jenkins with Docker, Maven, Java 21
- SonarQube with PostgreSQL 15
- Grafana Enterprise 11.4.0
- Prometheus 3.0.1 with alerting
- Node Exporter 1.8.2

**Usage:**
```bash
# Download directly from GitHub
curl -o setup-all-in-one-ec2.sh https://raw.githubusercontent.com/khushalbhavsar/DevOps-Enabled-Employee-Task---Productivity-Tracker/main/scripts/setup-all-in-one-ec2.sh

chmod +x setup-all-in-one-ec2.sh

# Optional: Set environment variables
export SONAR_DB_PASSWORD="YourPassword"
export GRAFANA_ADMIN_PASSWORD="YourPassword"

./setup-all-in-one-ec2.sh
```

**Installation Time:** ~15-20 minutes

---

### 6. fix-prometheus-install.sh 🔧 **NEW**
**Purpose:** Fix Prometheus installation if all-in-one script fails  
**Requirements:** Run on EC2 where all-in-one installation failed

**Usage:**
```bash
# Download and run
curl -o fix-prometheus-install.sh https://raw.githubusercontent.com/khushalbhavsar/DevOps-Enabled-Employee-Task---Productivity-Tracker/main/scripts/fix-prometheus-install.sh

chmod +x fix-prometheus-install.sh
./fix-prometheus-install.sh
```

This script will:
- Clean up partial Prometheus installation
- Properly install Prometheus 3.0.1
- Install Node Exporter 1.8.2
- Configure alerting rules
- Start all monitoring services

---

## Security Notes

⚠️ **Important Security Considerations:**

### Passwords & Credentials
- ✅ Change all default passwords immediately after installation
- ✅ Use environment variables for sensitive data (see scripts for `SONAR_DB_PASSWORD`, `GRAFANA_ADMIN_PASSWORD`)
- ✅ Never commit passwords or tokens to version control
- ✅ Use AWS Secrets Manager or Parameter Store for production

### Network Security
- ✅ Configure security groups to allow only necessary ports
- ✅ Restrict source IPs when possible (use VPN or bastion hosts)
- ✅ Enable HTTPS/TLS in production environments
- ✅ Use VPC and private subnets for sensitive services

### System Security
- ✅ Regularly update all software components (`sudo yum update -y`)
- ✅ Enable AWS CloudWatch logging
- ✅ Configure automated backups
- ✅ Review and apply security patches promptly
- ✅ Use IAM roles instead of access keys where possible

### Script Security
- ✅ Review scripts before execution
- ✅ Run scripts with appropriate permissions
- ✅ Check script integrity if downloading from external sources
- ✅ Use `set -e` in scripts to exit on errors (already implemented)
./stress-test-cpu.sh
# Press CTRL+C to stop
```

---
## Script Features

All scripts include:
- ✅ **Error Handling**: Exit on any error (`set -e`)
- ✅ **Colored Output**: Easy-to-read console messages (INFO, WARN, ERROR)
- ✅ **Progress Indicators**: Clear step-by-step progress
- ✅ **Auto IP Detection**: Automatically detects EC2 public IP
- ✅ **Service Validation**: Verifies service status after installation
- ✅ **Helpful Output**: Displays access URLs, credentials, and next steps
- ✅ **Environment Variables**: Support for custom configuration
- ✅ **Idempotency**: Can be re-run if needed (with caution)

## Troubleshooting Tips

### All Scripts
```bash
# Check script permissions
ls -la *.sh

# Make executable if needed
chmod +x setup-*.sh stress-test-cpu.sh

# View script output in detail
bash -x ./setup-jenkins-ec2.sh
```

### Connection Issues
```bash
# Test EC2 connectivity
ping <EC2-PUBLIC-IP>

# Check security group rules
aws ec2 describe-security-groups --group-ids <SG-ID>

# Verify service is listening
sudo netstat -tlnp | grep <PORT>
```

### Service Issues
```bash
# Check service status
sudo systemctl status <service-name>

# View detailed logs
sudo journalctl -u <service-name> -f

# Restart service
sudo systemctl restart <service-name>
```

## Additional Resources

- 📚 [Jenkins Documentation](https://www.jenkins.io/doc/)
- 📚 [SonarQube Documentation](https://docs.sonarqube.org/)
- 📚 [Prometheus Documentation](https://prometheus.io/docs/)
- 📚 [Grafana Documentation](https://grafana.com/docs/)
- 📚 [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- 📚 [Amazon Linux 2 Documentation](https://aws.amazon.com/amazon-linux-2/)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review service logs using commands in Quick Reference
3. Consult official documentation
4. Open an issue in the repository

---

**Last Updated:** December 10, 2025  
**Compatible With:** Amazon Linux 2, Amazon Linux 2023 (most scripts)  
**Maintained By:** DevOps Team
htop
```

**Check alerts:**
- Prometheus Alerts: `http://<EC2-IP>:9090/alerts`
- Grafana Dashboards: `http://<EC2-IP>:3000`

**Expected behavior:**
- CPU usage should spike to 80%+ within 1-2 minutes
- Prometheus `HighCPUUsage` alert should fire after 5 minutes
- Grafana dashboard should show CPU spike

### Stop the Stress Test
Press `CTRL + C` to gracefully stop all stress processes.
| Component     | Status Check                      | Browser URL   |
|---------------|-----------------------------------|---------------|
| Grafana       | systemctl status grafana-server   | :3000         |
| Prometheus    | systemctl status prometheus       | :9090         |
| Node Exporter | systemctl status node_exporter    | :9100/metrics |

### Popular Grafana Dashboard IDs

Use these dashboard IDs when importing dashboards in Grafana:

- **1860**: Node Exporter Full
- **11074**: Node Exporter for Prometheus Dashboard
- **405**: Node Exporter Server Metrics

---

## CPU Stress Testing

### Purpose
Test monitoring and alerting systems by simulating high CPU load.

### Usage

```bash
chmod +x stress-test-cpu.sh
./stress-test-cpu.sh
```

Press `CTRL + C` to stop the stress test.

### Verify Impact
In another terminal:
```bash
top
# or
htop
```

Check Prometheus alerts and Grafana dashboards for triggered alerts.

---

## Quick Reference Commands

### Jenkins
```bash
# Status
sudo systemctl status jenkins

# Restart
sudo systemctl restart jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Logs
sudo journalctl -u jenkins -f
```

### SonarQube
```bash
# Status
sudo systemctl status sonarqube

# Restart
sudo systemctl restart sonarqube

# Logs
tail -f /opt/sonarqube/logs/sonar.log
```

### Monitoring Stack
```bash
# Grafana
sudo systemctl status grafana-server
sudo systemctl restart grafana-server

# Prometheus
sudo systemctl status prometheus
sudo systemctl restart prometheus

# Node Exporter
sudo systemctl status node_exporter
sudo systemctl restart node_exporter
```

---

## Troubleshooting

### Jenkins
- **Port 8080 not accessible**: Check security group inbound rules
- **Service won't start**: Check logs with `sudo journalctl -u jenkins -f`

### SonarQube
- **Won't start**: Check system tuning (vm.max_map_count, file limits)
- **Database connection error**: Verify PostgreSQL is running and credentials are correct
- **Logs location**: `/opt/sonarqube/logs/`

### Monitoring Stack
- **Targets down in Prometheus**: Check if services are running
- **No data in Grafana**: Verify Prometheus data source configuration
- **Alerts not firing**: Check `/etc/prometheus/alert_rules.yml` syntax

---

## Security Notes

⚠️ **Important**: 
- Change all default passwords immediately
- Don't commit passwords or tokens to version control
- Use environment variables or secrets management for sensitive data
- Configure proper firewall rules and security groups
- Enable HTTPS in production environments
- Regularly update all software components

---

## Additional Resources

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
