# Project Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER / INGRESS                       │
│                   (Kubernetes Ingress)                           │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             ▼                                ▼
┌────────────────────────┐         ┌────────────────────────┐
│   FRONTEND SERVICE     │         │   BACKEND SERVICE      │
│   (React.js + Nginx)   │◄────────┤   (Node.js/Express)    │
│   Port: 80             │         │   Port: 5000           │
│   Replicas: 2-5        │         │   Replicas: 2-10       │
└────────────────────────┘         └───────────┬────────────┘
                                               │
                                               ▼
                                   ┌────────────────────────┐
                                   │   MONGODB SERVICE      │
                                   │   (NoSQL Database)     │
                                   │   Port: 27017          │
                                   │   PVC: 5Gi             │
                                   └────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                              │
├────────────────────────┬────────────────────────────────────────┤
│   PROMETHEUS          │         GRAFANA                         │
│   (Metrics)           │         (Visualization)                 │
│   Port: 9090          │         Port: 3000                      │
│   PVC: 10Gi           │         PVC: 5Gi                        │
└────────────────────────┴────────────────────────────────────────┘
```

## Component Flow

```
┌──────────┐      HTTP        ┌──────────┐      REST API    ┌──────────┐
│          │  ──────────────► │          │  ──────────────►  │          │
│  Client  │                  │ Frontend │                   │ Backend  │
│ (Browser)│  ◄────────────── │ (React)  │  ◄──────────────  │(Node.js) │
└──────────┘    HTML/JS       └──────────┘     JSON         └────┬─────┘
                                                                  │
                                                                  │ MongoDB
                                                                  │ Driver
                                                                  ▼
                                                            ┌──────────┐
                                                            │ MongoDB  │
                                                            │ Database │
                                                            └──────────┘
```

## CI/CD Pipeline Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│          │      │          │      │          │      │          │
│   CODE   │ ───► │  BUILD   │ ───► │   TEST   │ ───► │  SCAN    │
│ (GitHub) │      │(npm/node)│      │  (Jest)  │      │(SonarQube)│
└──────────┘      └──────────┘      └──────────┘      └──────────┘
                                                             │
                                                             ▼
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│          │      │          │      │          │      │          │
│ MONITOR  │ ◄─── │  DEPLOY  │ ◄─── │   PUSH   │ ◄─── │  BUILD   │
│(Grafana) │      │(K8s/EKS) │      │(DockerHub)│      │ (Docker) │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
```

## Data Flow

### User Authentication Flow
```
1. User enters credentials
2. Frontend sends to /api/auth/login
3. Backend validates credentials
4. Generate JWT token
5. Return token to frontend
6. Store token in localStorage
7. Include token in subsequent requests
```

### Task Management Flow
```
Admin:
1. Create task → POST /api/tasks
2. Assign to employee
3. Set priority and due date
4. Save to MongoDB

Employee:
1. View assigned tasks → GET /api/tasks
2. Update task status → PUT /api/tasks/:id
3. Mark complete
4. Productivity score calculated
5. Metrics sent to Prometheus
```

## Technology Stack Details

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context + React Query
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt, CORS
- **Logging**: Winston
- **Metrics**: prom-client (Prometheus)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: Jenkins / GitHub Actions
- **Code Quality**: SonarQube
- **Monitoring**: Prometheus + Grafana
- **Version Control**: Git + GitHub

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "admin" | "employee",
  department: String,
  position: String,
  isActive: Boolean,
  tasksCompleted: Number,
  productivityScore: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  assignedTo: ObjectId (ref: User),
  assignedBy: ObjectId (ref: User),
  status: "pending" | "in-progress" | "completed" | "cancelled",
  priority: "low" | "medium" | "high" | "urgent",
  dueDate: Date,
  completedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  comments: [{
    user: ObjectId,
    text: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks (filtered by role)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task (admin only)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (admin only)
- `POST /api/tasks/:id/comments` - Add comment

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics (admin)
- `GET /api/analytics/employee/:id` - Employee performance
- `GET /api/analytics/team` - Team analytics (admin)

## Security Measures

1. **Authentication**: JWT-based authentication
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: bcrypt hashing
4. **Rate Limiting**: Express rate limiter
5. **CORS**: Configured CORS policy
6. **Helmet**: Security headers
7. **Input Validation**: express-validator
8. **HTTPS**: TLS encryption (in production)

## Monitoring Metrics

### Application Metrics
- Task completion rate
- API request count and latency
- Employee productivity scores
- Error rates

### Infrastructure Metrics
- CPU usage
- Memory usage
- Network I/O
- Disk usage
- Pod status

## Scalability Features

1. **Horizontal Pod Autoscaling (HPA)**
   - Backend: 2-10 replicas based on CPU/Memory
   - Frontend: 2-5 replicas based on CPU

2. **Database Scaling**
   - MongoDB with persistent volumes
   - Can be configured for replica sets

3. **Load Balancing**
   - Kubernetes Service LoadBalancer
   - Ingress controller for routing

4. **Caching Strategy**
   - React Query for client-side caching
   - Can add Redis for server-side caching

## Deployment Environments

### Development
- Local Docker Compose
- Hot reload enabled
- Debug logging
- No resource limits

### Staging
- Kubernetes (Minikube/Cloud)
- Similar to production
- Testing and QA

### Production
- Kubernetes on cloud (EKS/AKS/GKE)
- Auto-scaling enabled
- High availability
- Monitoring and alerting
- Resource limits enforced
- TLS certificates

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
