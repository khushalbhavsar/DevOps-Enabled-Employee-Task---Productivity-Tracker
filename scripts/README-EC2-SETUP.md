# EC2 Setup Scripts for DevOps Pipeline

This directory contains automated setup scripts for configuring Jenkins, SonarQube, and Monitoring (Grafana + Prometheus + Node Exporter) on AWS EC2 instances.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Scripts Overview](#scripts-overview)
3. [Jenkins Setup](#jenkins-setup)
4. [SonarQube Setup](#sonarqube-setup)
5. [Monitoring Stack Setup](#monitoring-stack-setup)
6. [CPU Stress Test](#cpu-stress-test)
7. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### EC2 Instance Requirements

| Component | Instance Type | RAM | Security Group Ports |
|-----------|--------------|-----|---------------------|
| Jenkins | t3.large or c7i-flex.large | 8GB+ | 8080, 22 |
| SonarQube | t3.medium or larger | 4GB+ | 9000, 22 |
| Monitoring | t3.medium | 4GB+ | 3000, 9090, 9100, 22 |

### Common Prerequisites
- AWS EC2 instance running Amazon Linux 2
- SSH key pair (`.pem` file)
- Security groups configured with required ports
- User: `ec2-user`

---

## Scripts Overview

| Script | Purpose | Time |
|--------|---------|------|
| `setup-jenkins-ec2.sh` | Installs Jenkins, Docker, Maven, Git, Java 21 | ~5-10 min |
| `setup-sonarqube-ec2.sh` | Installs SonarQube, PostgreSQL, Sonar Scanner | ~10-15 min |
| `setup-monitoring-ec2.sh` | Installs Grafana, Prometheus, Node Exporter | ~5-10 min |
| `stress-test-cpu.sh` | CPU stress test for monitoring alerts | N/A |

---

## Jenkins Setup

### 1. Connect to EC2

```bash
cd ~/Downloads
chmod 400 jenkins.pem
ssh -i "jenkins.pem" ec2-user@<EC2-PUBLIC-IP>
```

### 2. Download and Run Script

```bash
# Download script
curl -O https://raw.githubusercontent.com/yourusername/yourrepo/main/scripts/setup-jenkins-ec2.sh

# Make executable
chmod +x setup-jenkins-ec2.sh

# Run with optional Git configuration
GIT_USER_NAME="Your Name" GIT_USER_EMAIL="your.email@example.com" ./setup-jenkins-ec2.sh
```

### 3. Post-Installation

The script will display:
- Jenkins initial admin password
- Access URL: `http://<EC2-IP>:8080`

**Next Steps:**
1. Open Jenkins URL in browser
2. Enter initial admin password
3. Install suggested plugins
4. Install additional plugins:
   - Docker
   - Docker Pipeline
   - Blue Ocean
   - AWS Credentials Plugin
   - SonarQube Scanner

### Jenkins Useful Commands

```bash
# Check status
sudo systemctl status jenkins

# Restart
sudo systemctl restart jenkins

# View logs
sudo journalctl -u jenkins -f

# Get admin password again
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

---

## SonarQube Setup

### 1. Connect to EC2

```bash
ssh -i "sonarqube.pem" ec2-user@<EC2-PUBLIC-IP>
```

### 2. Download and Run Script

```bash
# Download script
curl -O https://raw.githubusercontent.com/yourusername/yourrepo/main/scripts/setup-sonarqube-ec2.sh

# Make executable
chmod +x setup-sonarqube-ec2.sh

# Run with custom DB password (recommended for production)
SONAR_DB_PASSWORD="YourSecurePassword123!" ./setup-sonarqube-ec2.sh

# Or run with defaults (for testing only)
./setup-sonarqube-ec2.sh
```

### 3. Post-Installation

**Access SonarQube:**
- URL: `http://<EC2-IP>:9000`
- Default credentials: `admin` / `admin`
- Change password on first login

**Generate Authentication Token:**
1. Login to SonarQube
2. Go to: My Account → Security → Generate Token
3. Save token for Jenkins integration

### SonarQube Useful Commands

```bash
# Check status
sudo systemctl status sonarqube

# Restart
sudo systemctl restart sonarqube

# View logs
tail -f /opt/sonarqube/logs/sonar.log
tail -f /opt/sonarqube/logs/web.log

# Run manual scan
sonar-scanner \
  -Dsonar.projectKey=my-project \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://<EC2-IP>:9000 \
  -Dsonar.token=<YOUR-TOKEN>
```

---

## Monitoring Stack Setup

### 1. Connect to EC2

```bash
ssh -i "monitoring.pem" ec2-user@<EC2-PUBLIC-IP>
```

### 2. Download and Run Script

```bash
# Download script
curl -O https://raw.githubusercontent.com/yourusername/yourrepo/main/scripts/setup-monitoring-ec2.sh

# Make executable
chmod +x setup-monitoring-ec2.sh

# Run installation
./setup-monitoring-ec2.sh
```

### 3. Post-Installation

**Access Services:**

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| Grafana | http://\<EC2-IP\>:3000 | admin / admin |
| Prometheus | http://\<EC2-IP\>:9090 | N/A |
| Node Exporter | http://\<EC2-IP\>:9100/metrics | N/A |

### 4. Configure Grafana

1. **Login to Grafana** (change password on first login)

2. **Add Prometheus Data Source:**
   - Configuration → Data Sources → Add data source
   - Select: Prometheus
   - URL: `http://localhost:9090`
   - Click: Save & Test

3. **Import Dashboards:**
   - Dashboards → Import
   - Enter Dashboard ID:
     - **1860** - Node Exporter Full
     - **11074** - Node Exporter for Prometheus
     - **405** - Node Exporter Server Metrics
   - Select Prometheus data source
   - Click: Import

### Monitoring Useful Commands

```bash
# Check all services
sudo systemctl status grafana-server
sudo systemctl status prometheus
sudo systemctl status node_exporter

# Restart services
sudo systemctl restart grafana-server
sudo systemctl restart prometheus
sudo systemctl restart node_exporter

# View logs
sudo journalctl -u grafana-server -f
sudo journalctl -u prometheus -f

# View Prometheus targets
curl http://localhost:9090/api/v1/targets

# Test Node Exporter
curl http://localhost:9100/metrics
```

---

## CPU Stress Test

### Purpose
Test CPU monitoring alerts by artificially increasing CPU load.

### Usage

```bash
# Download script
curl -O https://raw.githubusercontent.com/yourusername/yourrepo/main/scripts/stress-test-cpu.sh

# Make executable
chmod +x stress-test-cpu.sh

# Run stress test
./stress-test-cpu.sh

# Press CTRL+C to stop
```

### Monitor Results

1. **Terminal:** Run `top` or `htop` in another session
2. **Prometheus:** Check alerts at `http://<EC2-IP>:9090/alerts`
3. **Grafana:** View CPU metrics in dashboards

### Expected Alerts

After 5 minutes of high CPU:
- **HighCPUUsage** alert should fire (>30%)
- Check in Prometheus Alerts page
- Should appear in Grafana if notification channels configured

---

## Security Best Practices

### 🔒 Production Recommendations

1. **Change Default Passwords**
   ```bash
   # Jenkins: Configure in UI
   # SonarQube: Change admin password on first login
   # Grafana: Change admin password on first login
   ```

2. **Use Environment Variables for Secrets**
   ```bash
   export SONAR_DB_PASSWORD="YourSecurePassword"
   export GRAFANA_ADMIN_PASSWORD="YourGrafanaPassword"
   ./setup-sonarqube-ec2.sh
   ```

3. **Configure Security Groups Properly**
   - Only allow necessary ports
   - Restrict source IPs where possible
   - Use VPC for internal communication

4. **Enable HTTPS**
   - Use AWS Application Load Balancer
   - Or configure Nginx reverse proxy with SSL

5. **Regular Updates**
   ```bash
   sudo yum update -y
   ```

6. **Backup Important Data**
   - Jenkins: `/var/lib/jenkins/`
   - SonarQube: PostgreSQL database
   - Grafana: `/var/lib/grafana/`
   - Prometheus: `/var/lib/prometheus/`

---

## Troubleshooting

### Jenkins Won't Start

```bash
# Check logs
sudo journalctl -u jenkins -f

# Check Java version
java --version

# Restart
sudo systemctl restart jenkins
```

### SonarQube Won't Start

```bash
# Check logs
tail -f /opt/sonarqube/logs/sonar.log

# Check ElasticSearch logs
tail -f /opt/sonarqube/logs/es.log

# Verify database
sudo -u postgres psql -c "\l"

# Check system limits
sysctl vm.max_map_count
```

### Prometheus Targets Down

```bash
# Check if services are running
sudo systemctl status node_exporter

# Test endpoint
curl http://localhost:9100/metrics

# Restart Prometheus
sudo systemctl restart prometheus
```

---

## Complete Setup Workflow

### Recommended Order

1. **Jenkins EC2** (Build & CI/CD)
2. **SonarQube EC2** (Code Quality)
3. **Monitoring EC2** (Metrics & Alerts)

### Integration Steps

1. **Jenkins → SonarQube:**
   - Install SonarQube Scanner plugin in Jenkins
   - Add SonarQube token to Jenkins credentials
   - Configure in Jenkins: Manage Jenkins → Configure System → SonarQube servers

2. **Jenkins → Docker Hub:**
   - Add Docker Hub credentials in Jenkins
   - Use in Jenkinsfile for image push

3. **Application → Prometheus:**
   - Expose `/metrics` endpoint in your app
   - Add scrape config in Prometheus

4. **Prometheus → Grafana:**
   - Add Prometheus as data source
   - Import dashboards
   - Configure alerts

---

## Support

For issues or questions:
1. Check script output and logs
2. Review AWS EC2 instance logs
3. Verify security group settings
4. Check service status with systemctl

---

**Last Updated:** December 2025  
**Maintained By:** DevOps Team
