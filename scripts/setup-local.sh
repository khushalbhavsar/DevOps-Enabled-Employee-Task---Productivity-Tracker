#!/bin/bash

# Local Development Setup Script

set -e

echo "================================================"
echo "Employee Productivity Tracker - Local Setup"
echo "================================================"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_green() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_yellow() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Create .env files
setup_env_files() {
    print_yellow "Setting up environment files..."
    
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        print_green "Backend .env created"
    fi
    
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        print_green "Frontend .env created"
    fi
}

# Install dependencies
install_dependencies() {
    print_yellow "Installing dependencies..."
    
    cd backend
    npm install
    cd ..
    print_green "Backend dependencies installed"
    
    cd frontend
    npm install
    cd ..
    print_green "Frontend dependencies installed"
}

# Start with Docker Compose
start_docker_compose() {
    print_yellow "Starting services with Docker Compose..."
    
    docker-compose up -d
    print_green "All services started"
    
    echo ""
    echo "Services are running at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3001 (admin/admin)"
    echo "  MongoDB: localhost:27017"
}

# Main function
main() {
    setup_env_files
    echo ""
    
    read -p "Install dependencies? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_dependencies
        echo ""
    fi
    
    read -p "Start Docker Compose services? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_docker_compose
        echo ""
    fi
    
    print_green "Setup completed!"
}

main
