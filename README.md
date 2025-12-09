# 📌 **Employee Productivity & Task Tracker – DevOps End-to-End Project**

🚀 A fully automated **DevOps Engineer portfolio project** designed to demonstrate end-to-end delivery, deployment, monitoring, and scalability of a real-world enterprise application.

---

## 🧠 **Project Overview**

Employee Productivity & Task Tracker is a cloud-native web application that allows an organization to **assign, track, and measure employee productivity**. The platform includes **Admin** and **Employee** roles for effective task management and real-time performance insights.

This project showcases **industry-level DevOps practices**, including CI/CD automation, secure deployments, scalability through Kubernetes, and complete monitoring using Prometheus and Grafana.

---

## 🎯 **Key Objectives**

* Implement complete DevOps lifecycle:
  **Plan → Code → Build → Test → Scan → Deploy → Monitor**
* Maintain high code quality using **SonarQube**
* Build and containerize application using **Docker Compose**
* Deploy scalable microservices on **Kubernetes**
* Monitor system health & performance with **Prometheus + Grafana**
* Ensure secure and reliable database communication with **MongoDB**

---

## 🏗️ **Architecture**

✨ Microservices-based design

```
👤 Users → 🌐 React Frontend → 🚀 Node.js/Express Backend
                       ↓
                  🗄️ MongoDB Database

CI/CD: GitHub → Jenkins
Quality: SonarQube
Deploy: Docker Compose + Kubernetes
Monitor: Prometheus + Grafana
```

Supports Auto-deployment + health monitoring + alerting

---

## 🛠️ **Tech & Tools Used**

| Category         | Tools                     |
| ---------------- | ------------------------- |
| Frontend         | React.js                  |
| Backend          | Node.js + Express         |
| Database         | MongoDB                   |
| CI/CD            | Jenkins / GitHub Actions  |
| Code Quality     | SonarQube                 |
| Orchestration    | Kubernetes (Minikube/EKS) |
| Monitoring       | Prometheus + Grafana      |
| Containerization | Docker                    |
| Version Control  | Git + GitHub              |

---

## 📌 **Core Features**

| Role     | Capabilities                                                      |
| -------- | ----------------------------------------------------------------- |
| Admin    | Add/update/delete tasks, assign tasks, view performance analytics |
| Employee | Manage, track, and complete assigned tasks                        |

✔ Dashboard with productivity score
✔ Task completion metrics
✔ JWT Authentication & Authorization
✔ RESTful API
✔ Fully responsive UI

---

## 📂 **Project Structure**

```
├── backend/                    # Node.js Backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Custom middleware
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Unit & Integration tests
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── context/           # Context API
│   │   ├── utils/             # Helper functions
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
│
├── kubernetes/                 # K8s Manifests
│   ├── deployments/
│   ├── services/
│   ├── configmaps/
│   ├── secrets/
│   └── ingress/
│
├── monitoring/                 # Monitoring Stack
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       └── dashboards/
│
├── jenkins/                    # CI/CD Pipeline
│   ├── Jenkinsfile
│   └── scripts/
│
├── .github/                    # GitHub Actions
│   └── workflows/
│       └── ci-cd.yml
│
├── docker-compose.yml          # Docker Compose
├── .gitignore
└── README.md
```

---

## 🚀 **Getting Started**

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- Kubernetes (Minikube/EKS)
- Jenkins (optional for CI/CD)
- MongoDB

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/employee-productivity-tracker.git
cd employee-productivity-tracker

# Start with Docker Compose
docker-compose up -d

# Access the application
Frontend: http://localhost:3000
Backend: http://localhost:5000
Grafana: http://localhost:3001
Prometheus: http://localhost:9090
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f kubernetes/

# Check deployment status
kubectl get pods
kubectl get services

# Access via NodePort or LoadBalancer
```

---

## 📈 **Monitoring Metrics Dashboard**

📊 Prometheus-exposed metrics:

* Task completion rate per employee
* API request count & latency
* Pod/container resource usage
* Error rate tracking

📟 Grafana visualizes:

* Application health & uptime
* Performance analytics
* Infrastructure load

---

## 🧾 **Deployment Workflow**

```
Developer → GitHub
      ↓
Jenkins → Build + Test + SonarQube Scan
      ↓
Docker Build & Push → Docker Hub
      ↓
Kubernetes Deployment (EKS/Minikube)
      ↓
Prometheus Scrape → Grafana Dashboards
```

---

## 🤝 **Why This Project Is Perfect for DevOps Roles**

✔ Real enterprise use-case
✔ Demonstrates **automation, containerization, orchestration & monitoring**
✔ Shows **cloud-native engineering & CI/CD mastery**
✔ Recruiters love practical DevOps implementation

---

## 📝 **License**

MIT License - feel free to use this project for learning and portfolio purposes.

---

## 👨‍💻 **Author**

**Khushal Bhavsar**
- GitHub: [@Khushal41](https://github.com/Khushal41)

---

## 🙏 **Acknowledgments**

This project demonstrates real-world DevOps practices suitable for enterprise environments.
