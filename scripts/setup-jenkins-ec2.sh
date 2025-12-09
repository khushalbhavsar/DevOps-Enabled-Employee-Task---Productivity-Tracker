#!/bin/bash

################################################################################
# Jenkins Setup Script for AWS EC2 (Amazon Linux 2)
# Instance Requirements: t3.large or c7i-flex.large
# Security Group: Port 8080 must be open
# User: ec2-user
################################################################################

set -e  # Exit on any error

echo "========================================"
echo "🚀 Jenkins Installation Script"
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

# Step 1: Update System
print_info "Step 1: Updating system packages..."
sudo yum update -y
sudo yum install wget tar tree python -y
print_info "✅ System updated successfully"

# Step 2: Install Git
print_info "Step 2: Installing and configuring Git..."
sudo yum install git -y
git config --global user.name "${GIT_USER_NAME:-DevOps User}"
git config --global user.email "${GIT_USER_EMAIL:-devops@example.com}"
git config --list
print_info "✅ Git installed and configured"

# Step 3: Install Docker
print_info "Step 3: Installing Docker..."
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
docker --version
print_info "✅ Docker installed successfully"
print_warning "Note: Jenkins user will be added to Docker group after Jenkins installation"

# Step 4: Install Maven
print_info "Step 4: Installing Maven..."
sudo yum install maven -y
mvn -v
print_info "✅ Maven installed successfully"

# Step 5: Install Java 21 (Amazon Corretto)
print_info "Step 5: Installing Java 21 (Amazon Corretto)..."
sudo yum install java-21-amazon-corretto.x86_64 -y
java --version
print_info "✅ Java 21 installed successfully"

# Step 6: Install Jenkins
print_info "Step 6: Installing Jenkins..."
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

sudo yum upgrade -y
sudo yum install fontconfig java-21-openjdk -y
sudo yum install jenkins -y

sudo systemctl daemon-reload
print_info "✅ Jenkins installed successfully"

# Step 7: Start and Enable Jenkins
print_info "Step 7: Starting Jenkins service..."
sudo systemctl start jenkins
sudo systemctl enable jenkins
jenkins --version
print_info "✅ Jenkins service started and enabled"

# Step 8: Configure Jenkins to use Docker
print_info "Step 8: Adding Jenkins user to Docker group..."
sudo usermod -aG docker jenkins
sudo systemctl restart docker
sudo systemctl restart jenkins
print_info "✅ Jenkins configured to use Docker"

# Wait for Jenkins to fully start
print_info "Waiting for Jenkins to initialize (30 seconds)..."
sleep 30

# Step 9: Display Jenkins Initial Admin Password
print_info "Step 9: Retrieving Jenkins initial admin password..."
echo ""
echo "========================================"
echo "🔑 JENKINS INITIAL ADMIN PASSWORD"
echo "========================================"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
echo "========================================"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<EC2-Public-IP>")

# Final Instructions
echo ""
echo "========================================"
echo "✅ JENKINS INSTALLATION COMPLETED!"
echo "========================================"
echo ""
echo "📋 Access Jenkins:"
echo "   URL: http://${PUBLIC_IP}:8080"
echo ""
echo "📋 Next Steps:"
echo "   1. Open the URL in your browser"
echo "   2. Paste the initial admin password shown above"
echo "   3. Install suggested plugins"
echo "   4. Create your first admin user"
echo ""
echo "📋 Additional Plugins to Install Manually:"
echo "   - Docker"
echo "   - Docker Pipeline"
echo "   - Blue Ocean"
echo "   - AWS Credentials Plugin"
echo "   - SonarQube Scanner"
echo ""
echo "📋 Useful Commands:"
echo "   Check Status:  sudo systemctl status jenkins"
echo "   Restart:       sudo systemctl restart jenkins"
echo "   Stop:          sudo systemctl stop jenkins"
echo "   Logs:          sudo journalctl -u jenkins -f"
echo ""
echo "========================================"
echo "🎉 Setup Complete!"
echo "========================================"
