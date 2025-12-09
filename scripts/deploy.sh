#!/bin/bash

# Employee Productivity Tracker - Deployment Script
# This script automates the deployment process

set -e

echo "================================================"
echo "Employee Productivity Tracker - Deployment"
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
NAMESPACE="productivity-tracker"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-yourdockerhub}"

# Functions
print_green() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_yellow() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_red() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_yellow "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_red "Docker is not installed"
        exit 1
    fi
    print_green "Docker installed"
    
    if ! command -v kubectl &> /dev/null; then
        print_red "kubectl is not installed"
        exit 1
    fi
    print_green "kubectl installed"
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        print_red "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    print_green "Connected to Kubernetes cluster"
}

# Build Docker images
build_images() {
    print_yellow "Building Docker images..."
    
    docker build -t ${DOCKER_USERNAME}/productivity-backend:latest ./backend
    print_green "Backend image built"
    
    docker build -t ${DOCKER_USERNAME}/productivity-frontend:latest ./frontend
    print_green "Frontend image built"
}

# Push Docker images
push_images() {
    print_yellow "Pushing Docker images..."
    
    docker push ${DOCKER_USERNAME}/productivity-backend:latest
    print_green "Backend image pushed"
    
    docker push ${DOCKER_USERNAME}/productivity-frontend:latest
    print_green "Frontend image pushed"
}

# Deploy to Kubernetes
deploy_k8s() {
    print_yellow "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl apply -f kubernetes/namespace.yaml
    print_green "Namespace created"
    
    # Apply ConfigMaps
    kubectl apply -f kubernetes/configmaps/
    print_green "ConfigMaps applied"
    
    # Apply Secrets (ensure you've created actual secrets)
    print_yellow "Please ensure secrets are properly configured before proceeding"
    
    # Apply Deployments
    kubectl apply -f kubernetes/deployments/
    print_green "Deployments applied"
    
    # Apply Services
    kubectl apply -f kubernetes/services/
    print_green "Services applied"
    
    # Apply Ingress
    kubectl apply -f kubernetes/ingress/
    print_green "Ingress applied"
    
    # Apply HPA
    kubectl apply -f kubernetes/hpa.yaml
    print_green "HPA applied"
}

# Wait for deployments
wait_for_deployments() {
    print_yellow "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/mongodb -n ${NAMESPACE}
    print_green "MongoDB ready"
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/backend -n ${NAMESPACE}
    print_green "Backend ready"
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/frontend -n ${NAMESPACE}
    print_green "Frontend ready"
}

# Verify deployment
verify_deployment() {
    print_yellow "Verifying deployment..."
    
    echo ""
    echo "Pods:"
    kubectl get pods -n ${NAMESPACE}
    
    echo ""
    echo "Services:"
    kubectl get services -n ${NAMESPACE}
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n ${NAMESPACE}
}

# Main deployment flow
main() {
    echo ""
    print_yellow "Starting deployment process..."
    echo ""
    
    check_prerequisites
    echo ""
    
    # Ask for confirmation
    read -p "Do you want to build and push Docker images? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_images
        echo ""
        push_images
        echo ""
    fi
    
    read -p "Do you want to deploy to Kubernetes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_k8s
        echo ""
        wait_for_deployments
        echo ""
        verify_deployment
        echo ""
    fi
    
    print_green "Deployment completed successfully!"
    echo ""
    echo "================================================"
    echo "Access your application:"
    echo "Frontend: Check your LoadBalancer service IP"
    echo "Prometheus: http://<prometheus-service-ip>:9090"
    echo "Grafana: http://<grafana-service-ip>:3000"
    echo "================================================"
}

# Run main function
main
