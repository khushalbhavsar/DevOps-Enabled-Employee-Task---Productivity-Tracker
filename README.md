# DevOps-Enabled Employee Task & Productivity Tracker

A comprehensive full-stack application for employee task management and productivity tracking with complete DevOps pipeline, monitoring, and container orchestration.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [EC2 Setup Guide](#ec2-setup-guide)
- [Jenkins Setup](#jenkins-setup)
- [Kubernetes Cluster Setup](#kubernetes-cluster-setup)
- [Application Deployment](#application-deployment)
- [Monitoring Setup](#monitoring-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This project provides a complete employee productivity tracking system with:

- **Backend**: Node.js/Express REST API with JWT authentication
- **Frontend**: React application with Material-UI
- **Database**: MongoDB with Mongoose ODM
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes with auto-scaling
- **CI/CD**: Jenkins & GitHub Actions pipelines
- **Monitoring**: Prometheus & Grafana stack
- **Code Quality**: SonarQube integration

### Key Features

✅ User Authentication & Role-based Access Control  
✅ Task Management System  
✅ Employee Productivity Analytics  
✅ Real-time Metrics & Dashboards  
✅ Automated CI/CD Pipelines  
✅ Container Orchestration  
✅ Monitoring & Alerting  
✅ Code Quality Analysis  

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │ Express Backend │    │    MongoDB      │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Kubernetes    │
                    │   Cluster       │
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │   Monitoring    │
                    │ Prometheus/Grafana│
                    └─────────────────┘
```

## 📋 Prerequisites

### System Requirements

- **EC2 Instance**: t3.xlarge or larger (16GB RAM minimum)
- **Storage**: 30GB+ free space
- **OS**: Amazon Linux 2 or Amazon Linux 2023
- **Security Group Ports**: 22, 80, 443, 3000, 5000, 8080, 9000, 9090, 9100, 30000-32767

### Required Tools

- Docker & Docker Compose
- kubectl
- AWS CLI
- Git
- Java 21 (Amazon Corretto)
- Maven
- Node.js 18+

## 🚀 Quick Start

### Option 1: Local Development (Docker Compose)

```bash
# Clone repository
git clone https://github.com/yourusername/employee-productivity-tracker.git
cd employee-productivity-tracker

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

### Option 2: Production Deployment (EC2 + Kubernetes)

Follow the complete EC2 setup guide below.

## ☁️ EC2 Setup Guide

### Launch EC2 Instance

1. **EC2 Configuration**:
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: t3.xlarge (4 vCPU, 16GB RAM)
   - **Storage**: 30GB gp3
   - **Security Group**: Open ports 22, 80, 443, 3000, 5000, 8080, 9000, 9090, 9100

2. **Connect to EC2**:
```bash
cd ~/Downloads
chmod 400 your-key.pem
ssh -i "your-key.pem" ec2-user@<EC2-PUBLIC-IP>
```

### Update System & Install Dependencies

```bash
# Update system
sudo yum update -y

# Install essential tools
sudo yum install wget tar tree unzip git make python3 -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI (optional, for EKS)
aws configure

# Install eksctl (for EKS clusters)
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Install k3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Install Java 21
sudo yum install java-21-amazon-corretto.x86_64 -y
java --version

# Install Maven
sudo yum install maven -y
mvn -v

# Install Node.js 18+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node --version
npm --version
```

## 🔧 Jenkins Setup

### Automated Installation (Recommended)

```bash
# Download and run Jenkins setup script
curl -o setup-jenkins-ec2.sh https://raw.githubusercontent.com/yourusername/employee-productivity-tracker/main/scripts/setup-jenkins-ec2.sh
chmod +x setup-jenkins-ec2.sh

# Optional: Configure Git
export GIT_USER_NAME="Your Name"
export GIT_USER_EMAIL="your.email@example.com"

# Run installation
./setup-jenkins-ec2.sh
```

### Manual Jenkins Installation

```bash
# Install Jenkins repository
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

# Install Jenkins
sudo yum install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Allow Jenkins to use Docker
sudo usermod -aG docker jenkins
sudo systemctl restart docker
sudo systemctl restart jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

**Access Jenkins**: `http://<EC2-PUBLIC-IP>:8080`

### Configure Jenkins

1. Install suggested plugins
2. Create admin user
3. Install additional plugins:
   - Docker Pipeline
   - Kubernetes
   - SonarQube Scanner
   - Blue Ocean

## ☸️ Kubernetes Cluster Setup

### Option 1: K3s (Lightweight, Single Node)

```bash
# Install K3s (already done in prerequisites)
curl -sfL https://get.k3s.io | sh -

# Check cluster status
sudo kubectl get nodes
sudo kubectl get pods -A

# Configure kubectl for current user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
```

### Option 2: EKS (Production Cluster)

```bash
# Create EKS cluster
eksctl create cluster \
  --name productivity-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name productivity-cluster

# Verify cluster
kubectl get nodes
kubectl cluster-info
```

### Option 3: Minikube (Local Development)

```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --cpus=4 --memory=8192

# Enable ingress
minikube addons enable ingress
```

## 🚀 Application Deployment

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/employee-productivity-tracker.git
cd employee-productivity-tracker
```

### 2. Configure Environment

```bash
# Backend environment
cp backend/.env.example backend/.env
nano backend/.env

# Add to backend/.env:
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/productivity-tracker
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://your-domain.com

# Frontend environment
cp frontend/.env.example frontend/.env
nano frontend/.env

# Add to frontend/.env:
REACT_APP_API_URL=http://your-domain.com/api
```

### 3. Build Docker Images

```bash
# Login to Docker Hub
docker login

# Build and push backend
docker build -t yourdockerhub/productivity-backend:latest ./backend
docker push yourdockerhub/productivity-backend:latest

# Build and push frontend
docker build -t yourdockerhub/productivity-frontend:latest ./frontend
docker push yourdockerhub/productivity-frontend:latest
```

### 4. Update Kubernetes Manifests

```bash
# Update image references in deployments
sed -i 's/yourdockerhub/your-actual-dockerhub-username/g' kubernetes/deployments/*.yaml

# Create secrets
kubectl create secret generic backend-secret \
  --from-literal=JWT_SECRET=your-super-secure-jwt-secret-key-here \
  --from-literal=MONGODB_URI=mongodb://mongodb:27017/productivity-tracker \
  -n productivity-tracker
```

### 5. Deploy to Kubernetes

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### Manual Deployment Commands

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Apply configurations
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/secrets/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/ingress/
kubectl apply -f kubernetes/hpa.yaml

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n productivity-tracker
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n productivity-tracker
kubectl wait --for=condition=available --timeout=300s deployment/mongodb-deployment -n productivity-tracker

# Check status
kubectl get pods -n productivity-tracker
kubectl get services -n productivity-tracker
kubectl get ingress -n productivity-tracker
```

## 📊 Monitoring Setup

### Automated Setup (All-in-One)

```bash
# Download and run monitoring setup
curl -o setup-monitoring-ec2.sh https://raw.githubusercontent.com/yourusername/employee-productivity-tracker/main/scripts/setup-monitoring-ec2.sh
chmod +x setup-monitoring-ec2.sh
./setup-monitoring-ec2.sh
```

### Manual Monitoring Setup

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvf prometheus-2.45.0.linux-amd64.tar.gz
sudo mv prometheus-2.45.0.linux-amd64 /opt/prometheus

# Create Prometheus service
sudo tee /etc/systemd/system/prometheus.service > /dev/null <<EOF
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=ec2-user
ExecStart=/opt/prometheus/prometheus --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.path=/opt/prometheus/data
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start prometheus
sudo systemctl enable prometheus

# Install Grafana
sudo tee /etc/yum.repos.d/grafana.repo > /dev/null <<EOF
[grafana]
name=grafana
baseurl=https://packages.grafana.com/oss/rpm
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://packages.grafana.com/gpg.key
sslverify=1
sslcacerts=/etc/pki/tls/certs/ca-bundle.crt
EOF

sudo yum install grafana -y
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Install Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvf node_exporter-1.6.1.linux-amd64.tar.gz
sudo mv node_exporter-1.6.1.linux-amd64 /opt/node_exporter

sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=ec2-user
ExecStart=/opt/node_exporter/node_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

**Access URLs**:
- **Grafana**: `http://<EC2-IP>:3000` (admin/Admin@123)
- **Prometheus**: `http://<EC2-IP>:9090`
- **Node Exporter**: `http://<EC2-IP>:9100/metrics`

## 🔄 CI/CD Pipeline

### Jenkins Pipeline Setup

1. **Create New Pipeline Job**:
   - Job Name: `productivity-tracker-pipeline`
   - Pipeline: Pipeline script from SCM
   - Repository URL: `https://github.com/yourusername/employee-productivity-tracker`
   - Script Path: `jenkins/Jenkinsfile`

2. **Configure Credentials**:
   - Docker Hub credentials
   - GitHub credentials
   - Kubernetes config

3. **Build Triggers**:
   - Poll SCM: `H/5 * * * *` (every 5 minutes)
   - Or webhook for automatic builds

### GitHub Actions (Alternative)

1. **Add Secrets to GitHub**:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `KUBE_CONFIG`
   - `SONAR_TOKEN`

2. **Workflow**:
   - Located in `.github/workflows/ci-cd.yml`
   - Triggers on push to main branch
   - Runs tests, builds, and deploys

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/productivity-tracker
JWT_SECRET=your-256-bit-secret
JWT_EXPIRE=7d
FRONTEND_URL=https://yourdomain.com
```

#### Frontend (.env)
```env
REACT_APP_API_URL=https://yourdomain.com/api
```

### Kubernetes Secrets

```bash
# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=your-secret \
  --from-literal=DATABASE_URL=mongodb://... \
  -n productivity-tracker
```

### Docker Hub Images

Update image references in `kubernetes/deployments/*.yaml`:
```yaml
image: yourdockerhub/productivity-backend:latest
image: yourdockerhub/productivity-frontend:latest
```

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
POST /api/auth/logout
```

### Task Management

```
GET    /api/tasks       # Get all tasks
POST   /api/tasks       # Create task
GET    /api/tasks/:id   # Get task by ID
PUT    /api/tasks/:id   # Update task
DELETE /api/tasks/:id   # Delete task
```

### User Management (Admin Only)

```
GET    /api/users       # Get all users
GET    /api/users/:id   # Get user by ID
PUT    /api/users/:id   # Update user
DELETE /api/users/:id   # Delete user
```

### Analytics

```
GET /api/analytics/dashboard
GET /api/analytics/productivity
GET /api/analytics/tasks
```

### Health Check

```
GET /health     # Application health
GET /metrics    # Prometheus metrics
```

## 🔧 Troubleshooting

### Common Issues

1. **Jenkins can't connect to Docker**:
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

2. **Kubernetes pods not starting**:
```bash
kubectl describe pod <pod-name> -n productivity-tracker
kubectl logs <pod-name> -n productivity-tracker
```

3. **Database connection issues**:
```bash
kubectl exec -it mongodb-pod -n productivity-tracker -- mongo
```

4. **Ingress not working**:
```bash
kubectl get ingress -n productivity-tracker
kubectl describe ingress productivity-ingress -n productivity-tracker
```

### Logs & Monitoring

```bash
# Application logs
kubectl logs -f deployment/backend-deployment -n productivity-tracker
kubectl logs -f deployment/frontend-deployment -n productivity-tracker

# System monitoring
kubectl top pods -n productivity-tracker
kubectl top nodes

# Jenkins logs
sudo journalctl -u jenkins -f

# Docker logs
docker-compose logs -f
```

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Reset Kubernetes
kubectl delete namespace productivity-tracker

# Clean Docker
docker system prune -a --volumes

# Reset Jenkins
sudo systemctl stop jenkins
sudo rm -rf /var/lib/jenkins/*
sudo systemctl start jenkins
```

## 📞 Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs using the commands above
- Ensure all prerequisites are met
- Verify security group configurations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Deploying! 🚀**</content>
<parameter name="filePath">d:\AWS-Project-HostGithub\DevOps-Enabled Employee Task & Productivity Tracker\DevOps-Enabled-Employee-Task---Productivity-Tracker\README.md
