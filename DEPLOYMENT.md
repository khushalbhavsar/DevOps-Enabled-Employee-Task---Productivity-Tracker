# Employee Productivity Tracker - Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Node.js** (v18 or higher)
- **Docker** & **Docker Compose**
- **Kubernetes** (Minikube/EKS/AKS/GKE)
- **kubectl** CLI
- **Git**
- **Jenkins** (optional, for CI/CD)

### Accounts Needed

- Docker Hub account
- GitHub account
- Cloud provider account (AWS/Azure/GCP) - optional

---

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/employee-productivity-tracker.git
cd employee-productivity-tracker
```

### 2. Setup Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env and update values

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env and update API URL
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Run Locally (Without Docker)

**Terminal 1 - MongoDB:**
```bash
# Install and run MongoDB locally, or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

Access the app at `http://localhost:3000`

---

## Docker Deployment

### Using Docker Compose (Recommended for Local)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Services Available:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **MongoDB**: localhost:27017

### Build Individual Images

```bash
# Backend
docker build -t productivity-backend:latest ./backend

# Frontend
docker build -t productivity-frontend:latest ./frontend
```

---

## Kubernetes Deployment

### 1. Prerequisites

Ensure you have a Kubernetes cluster running:

```bash
# For Minikube
minikube start --cpus=4 --memory=8192

# For cloud providers, ensure kubectl is configured
kubectl cluster-info
```

### 2. Update Docker Images

Update image references in Kubernetes manifests:

```bash
# Edit kubernetes/deployments/backend-deployment.yaml
# Edit kubernetes/deployments/frontend-deployment.yaml
# Replace 'yourdockerhub' with your actual Docker Hub username
```

### 3. Create Secrets

```bash
# Create actual secrets (don't use example values in production)
kubectl create secret generic backend-secret \
  --from-literal=JWT_SECRET=your-actual-secret-key \
  -n productivity-tracker
```

### 4. Deploy Using Script

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 5. Manual Deployment

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Apply ConfigMaps
kubectl apply -f kubernetes/configmaps/

# Apply Secrets
kubectl apply -f kubernetes/secrets/

# Deploy applications
kubectl apply -f kubernetes/deployments/

# Create services
kubectl apply -f kubernetes/services/

# Setup ingress
kubectl apply -f kubernetes/ingress/

# Apply autoscaling
kubectl apply -f kubernetes/hpa.yaml
```

### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n productivity-tracker

# Check services
kubectl get svc -n productivity-tracker

# Check ingress
kubectl get ingress -n productivity-tracker

# View logs
kubectl logs -f deployment/backend -n productivity-tracker
```

### 7. Access Application

```bash
# For LoadBalancer
kubectl get svc frontend-service -n productivity-tracker

# For Minikube
minikube service frontend-service -n productivity-tracker

# For Ingress (update /etc/hosts or DNS)
# Point productivity.yourdomain.com to your ingress IP
```

---

## CI/CD Pipeline Setup

### GitHub Actions

1. **Add Secrets to GitHub:**
   - Go to Settings → Secrets and variables → Actions
   - Add:
     - `DOCKER_USERNAME`
     - `DOCKER_PASSWORD`
     - `KUBE_CONFIG` (base64 encoded kubeconfig)
     - `SONAR_TOKEN` (optional)
     - `SONAR_HOST_URL` (optional)

2. **Push to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

3. **Pipeline runs automatically** on push to main branch

### Jenkins Setup

1. **Install Jenkins** and required plugins:
   - Docker Pipeline
   - Kubernetes
   - SonarQube Scanner

2. **Configure Credentials:**
   - Docker Hub credentials
   - Kubeconfig
   - SonarQube token

3. **Create Pipeline:**
   - New Item → Pipeline
   - Point to `jenkins/Jenkinsfile`
   - Build Now

---

## Monitoring Setup

### Prometheus

Access Prometheus:
```bash
kubectl port-forward svc/prometheus-service 9090:9090 -n productivity-tracker
```

Open: http://localhost:9090

### Grafana

Access Grafana:
```bash
kubectl port-forward svc/grafana-service 3000:3000 -n productivity-tracker
```

Open: http://localhost:3000
- Username: `admin`
- Password: `admin` (change on first login)

**Add Prometheus Data Source:**
1. Configuration → Data Sources → Add data source
2. Select Prometheus
3. URL: `http://prometheus-service:9090`
4. Save & Test

**Import Dashboard:**
1. Create → Import
2. Upload `monitoring/grafana/dashboards/productivity-dashboard.json`

### Custom Metrics

Backend exposes metrics at: `http://backend-service:5000/metrics`

Available metrics:
- `tasks_total` - Total tasks created
- `employee_productivity_score` - Productivity score per employee
- HTTP request metrics
- Node.js process metrics

---

## Troubleshooting

### Common Issues

**1. Pods not starting:**
```bash
kubectl describe pod <pod-name> -n productivity-tracker
kubectl logs <pod-name> -n productivity-tracker
```

**2. ImagePullBackOff:**
- Ensure Docker images are pushed to registry
- Check image names in deployments
- Verify Docker Hub credentials

**3. Connection refused to MongoDB:**
- Check MongoDB pod is running
- Verify service name in connection string
- Check network policies

**4. Frontend can't connect to Backend:**
- Verify API URL in frontend environment
- Check CORS settings in backend
- Ensure backend service is running

**5. Health checks failing:**
```bash
# Test backend health
kubectl exec -it <backend-pod> -n productivity-tracker -- curl localhost:5000/health

# Test frontend health
kubectl exec -it <frontend-pod> -n productivity-tracker -- wget -qO- localhost/health
```

### Useful Commands

```bash
# Scale deployment
kubectl scale deployment backend --replicas=3 -n productivity-tracker

# Restart deployment
kubectl rollout restart deployment/backend -n productivity-tracker

# View resource usage
kubectl top pods -n productivity-tracker

# Debug pod
kubectl exec -it <pod-name> -n productivity-tracker -- /bin/sh

# Port forward to service
kubectl port-forward svc/backend-service 5000:5000 -n productivity-tracker
```

---

## Performance Optimization

### Database Indexing

Ensure MongoDB indexes are created:
```javascript
db.tasks.createIndex({ assignedTo: 1, status: 1 })
db.tasks.createIndex({ dueDate: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

### Horizontal Pod Autoscaling

HPA is configured to scale based on:
- CPU: 70% threshold
- Memory: 80% threshold

Monitor scaling:
```bash
kubectl get hpa -n productivity-tracker
```

---

## Security Best Practices

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable HTTPS** with TLS certificates
4. **Implement rate limiting** (already configured)
5. **Regular security scans** with SonarQube
6. **Keep dependencies updated**
7. **Use secrets management** (Kubernetes Secrets/Vault)
8. **Enable network policies**

---

## Next Steps

- [ ] Configure domain and SSL certificates
- [ ] Set up log aggregation (ELK/Loki)
- [ ] Implement backup strategy for MongoDB
- [ ] Configure alerting rules in Prometheus
- [ ] Set up disaster recovery plan
- [ ] Performance testing and optimization
- [ ] Security audit and penetration testing

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/employee-productivity-tracker/issues
- Documentation: See README.md

---

**Happy Deploying! 🚀**
