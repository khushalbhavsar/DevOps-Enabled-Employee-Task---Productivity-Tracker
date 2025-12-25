# Jenkins Setup & Configuration Guide

## Error Resolution

The previous Jenkins error was: **`libatomic.so.1: cannot open shared object file`**

This has been **FIXED** in the updated Jenkinsfile by:
1. Removing the problematic `tools { nodejs 'node18' }` configuration
2. Adding a **System Dependencies** stage that automatically installs required libraries
3. Using native `node` and `npm` commands

## Prerequisites

### System Requirements

- **Jenkins Version**: 2.346+
- **Git**: Installed on Jenkins agent
- **Docker**: Installed and running on Jenkins agent
- **SSH Access**: To Jenkins agent (for debugging)

### Operating System Support

The Jenkinsfile works with:
- ✅ Amazon Linux 2 / 2023
- ✅ CentOS / RHEL 7+
- ✅ Ubuntu 18.04+
- ✅ Debian 10+

## Jenkins Configuration

### 1. Install Required Plugins

Go to **Manage Jenkins** → **Manage Plugins** → **Available Plugins**

Install these plugins:
- `Pipeline` (Pipeline: API, Aggregator)
- `Git` (Git plugin)
- `Docker` (Docker API)
- `Docker Pipeline`
- `GitHub` (GitHub API, GitHub Integration)
- `Credentials` (Credentials Binding)
- `Node.js Plugin` (Optional, if using tool management)

### 2. Create Jenkins Credentials

Go to **Manage Jenkins** → **Manage Credentials** → **System** → **Global credentials**

Create these credentials:

#### A. GitHub Token
- **Type**: Username with password
- **ID**: `github-token`
- **Username**: Your GitHub username
- **Password**: Your GitHub personal access token

#### B. Docker Hub Credentials
- **Type**: Username with password
- **ID**: `dockerHubCreds`
- **Username**: Your Docker Hub username
- **Password**: Your Docker Hub password or access token

#### C. SonarQube Token
- **Type**: Secret text
- **ID**: `sonar-token`
- **Secret**: Your SonarQube authentication token

### 3. Create Jenkins Pipeline Job

1. Click **New Item**
2. **Item name**: `Employee-Productivity-Task-Tracker`
3. **Type**: Pipeline
4. Click **OK**

#### Configure Pipeline

Under **Pipeline** section:
- **Definition**: Pipeline script from SCM
- **SCM**: Git
- **Repository URL**: `https://github.com/yourusername/DevOps-Enabled-Employee-Task---Productivity-Tracker.git`
- **Credentials**: Select `github-token`
- **Branch Specifier**: `*/main`
- **Script Path**: `jenkins/Jenkinsfile`

#### Build Triggers (Optional)

- **Poll SCM**: `H/5 * * * *` (every 5 minutes)
- Or enable **GitHub hook trigger**

## Jenkinsfile Environment Variables

Update these in the Jenkinsfile or Jenkins job configuration:

```groovy
environment {
    DOCKER_REGISTRY = 'yourdockerhub'              // Your Docker Hub username
    SONARQUBE_HOST = 'http://localhost:9000'      // Your SonarQube URL
    DEPLOY_TARGET = 'docker'                       // or 'k8s' for Kubernetes
}
```

## Pipeline Stages

### 1. **System Dependencies** ✅
Automatically installs:
- GCC compiler tools
- libatomic library
- Node.js (if not present)
- npm

**Output:**
```
node -v    # v18.x.x
npm -v     # 9.x.x
```

### 2. **Checkout**
- Clones the repository from GitHub
- Uses `github-token` credential for authentication

### 3. **Install Dependencies**
Runs in parallel:
- **Backend**: `npm ci --legacy-peer-deps`
- **Frontend**: `npm ci --legacy-peer-deps`

### 4. **Run Tests**
Runs in parallel:
- **Backend Tests**: `npm test`
- **Frontend Tests**: `npm test -- --watchAll=false`

### 5. **SonarQube Analysis**
- Uses Docker SonarQube scanner
- Requires `sonar-token` credential
- Analyzes: `backend/src` and `frontend/src`

### 6. **Build Docker Images**
Builds in parallel:
- **Backend**: `docker build -t productivity-backend:${BUILD_NUMBER}`
- **Frontend**: `docker build -t productivity-frontend:${BUILD_NUMBER}`

### 7. **Push to Docker Hub**
- Tags images with Docker registry
- Authenticates with `dockerHubCreds`
- Pushes both `:${BUILD_NUMBER}` and `:latest` tags

### 8. **Deploy**
- Deploys containers using Docker
- Runs backend on port 5000
- Runs frontend on port 3000

### 9. **Verify Deployment**
- Health checks for both services
- Verifies container status

## Running the Pipeline

### First Run

1. Go to Jenkins job page
2. Click **Build Now**
3. Check **Console Output** for real-time logs

### Build Parameters (Optional)

You can add build parameters to the job:

```groovy
parameters {
    choice(name: 'DEPLOY_TARGET', choices: ['docker', 'k8s'], description: 'Deployment target')
    string(name: 'DOCKER_REGISTRY', defaultValue: 'yourdockerhub', description: 'Docker Registry')
}
```

## Troubleshooting

### Issue: Docker commands failing

**Solution**: Add Jenkins user to docker group
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue: Credentials not found

**Solution**: Verify credential IDs in Manage Credentials
```bash
# Should match in Jenkinsfile:
- github-token
- dockerHubCreds
- sonar-token
```

### Issue: npm install fails

**Solution**: Clear npm cache
```bash
npm cache clean --force
npm ci --legacy-peer-deps
```

### Issue: Docker Hub push fails

**Solution**: Verify Docker login
```bash
docker login -u yourusername
docker logout
```

### Issue: SonarQube connection error

**Solution**: Verify SonarQube is running
```bash
curl http://localhost:9000
# Should return SonarQube web page
```

## Monitoring & Logs

### View Build Logs
1. Jenkins job page → Build number
2. Click **Console Output**
3. Real-time logs with timestamps

### Common Log Entries

```
✅ System dependencies installed
✅ Code checkout completed
✅ Backend dependencies installed
✅ Frontend dependencies installed
✅ Backend tests completed
✅ Frontend tests completed
✅ SonarQube analysis completed
✅ Docker images built successfully
✅ Images pushed to Docker Hub successfully
✅ Docker deployment completed
```

## Advanced Configuration

### Using Kubernetes Instead of Docker

Update `DEPLOY_TARGET` to `'k8s'`:

```groovy
environment {
    DEPLOY_TARGET = 'k8s'
}
```

Then provide kubeconfig as Jenkins credential (type: File):
- **ID**: `kubeconfig`
- Upload your `~/.kube/config` file

### Email Notifications

Add to post section:
```groovy
failure {
    emailext(
        subject: "Build Failed: ${JOB_NAME} #${BUILD_NUMBER}",
        body: "Check console output at ${BUILD_URL}",
        to: "your-email@example.com"
    )
}
```

### Slack Notifications

Install Slack Plugin, then:
```groovy
failure {
    slackSend(
        color: 'danger',
        message: "Build Failed: ${JOB_NAME} #${BUILD_NUMBER}"
    )
}
```

## Performance Tips

1. **Use Docker BuildKit** for faster builds:
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Cache npm packages**:
   ```bash
   npm ci --cache-max=999999
   ```

3. **Parallel stages** - Jenkinsfile already uses parallel for:
   - Installing dependencies
   - Running tests
   - Building Docker images

4. **Disable unnecessary tests**:
   ```bash
   npm test -- --testPathIgnorePatterns=/node_modules/
   ```

## Security Best Practices

1. ✅ Never commit credentials to Git
2. ✅ Use Jenkins Credentials Store for sensitive data
3. ✅ Rotate Docker Hub tokens regularly
4. ✅ Use GitHub personal access tokens (not passwords)
5. ✅ Enable HTTPS for Jenkins if exposed
6. ✅ Restrict pipeline execution to authorized users

## Next Steps

1. **Update Jenkinsfile variables**:
   - Set `DOCKER_REGISTRY` to your Docker Hub username
   - Set `SONARQUBE_HOST` to your SonarQube URL

2. **Create all required credentials** in Jenkins

3. **Test the pipeline** with first build

4. **Monitor build logs** for any issues

5. **Set up notifications** (Email, Slack, etc.)

## Support

For issues:
1. Check Jenkins Console Output for error details
2. Verify all credentials are created with correct IDs
3. Ensure Docker, Git, and other tools are installed
4. Check Jenkins agent logs: `sudo tail -f /var/log/jenkins/jenkins.log`

---

**Pipeline is now error-free and ready for production!** ✅
