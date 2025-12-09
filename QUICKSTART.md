# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Docker Compose (Easiest)

```bash
# 1. Clone the repository
git clone https://github.com/Khushal41/employee-productivity-tracker.git
cd employee-productivity-tracker

# 2. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

### Option 2: Local Development

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 2. Backend setup
cd backend
npm install
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm start

# Access at http://localhost:3000
```

### Option 3: Kubernetes

```bash
# 1. Ensure kubectl is configured
kubectl cluster-info

# 2. Update Docker image references
# Edit kubernetes/deployments/*.yaml files

# 3. Deploy
./scripts/deploy.sh

# Or manually:
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmaps/
kubectl apply -f kubernetes/deployments/
kubectl apply -f kubernetes/services/
```

## 📝 Default Credentials

Create your first admin user by registering through the UI or using the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

## 🔧 Configuration

### Backend Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/productivity-tracker
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📊 Features to Try

1. **Register/Login** - Create admin and employee accounts
2. **Create Tasks** - Admin can create and assign tasks
3. **Task Management** - Employees can update task status
4. **Analytics** - View productivity metrics and dashboards
5. **Monitoring** - Check Prometheus metrics and Grafana dashboards

## 🛠️ Development Commands

### Backend
```bash
npm run dev      # Start dev server with nodemon
npm test         # Run tests
npm run lint     # Run linter
npm start        # Production server
```

### Frontend
```bash
npm start        # Development server
npm test         # Run tests
npm run build    # Production build
```

### Docker
```bash
docker-compose up -d           # Start services
docker-compose logs -f         # View logs
docker-compose down            # Stop services
docker-compose down -v         # Stop and remove volumes
```

### Kubernetes
```bash
kubectl get pods -n productivity-tracker        # List pods
kubectl logs -f <pod-name> -n productivity-tracker  # View logs
kubectl describe pod <pod-name> -n productivity-tracker  # Pod details
kubectl port-forward svc/frontend-service 3000:80 -n productivity-tracker  # Access frontend
```

## 📚 Documentation

- [Complete README](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Documentation](./ARCHITECTURE.md)

## 🐛 Troubleshooting

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker restart mongodb
```

**Port already in use:**
```bash
# Find and kill process using port
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

**Docker issues:**
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

## 🎯 Next Steps

1. ✅ Set up the application locally
2. ✅ Create admin and employee users
3. ✅ Create and assign tasks
4. ✅ Explore analytics dashboards
5. ✅ Check monitoring in Grafana
6. 📝 Deploy to Kubernetes
7. 🚀 Set up CI/CD pipeline
8. 🔒 Configure production security

## 💡 Tips

- Use Docker Compose for local development
- Use Kubernetes for production deployment
- Check logs if something doesn't work
- Refer to DEPLOYMENT.md for detailed instructions
- Monitor application health via /health endpoints

---

**Happy Coding! 🎉**
