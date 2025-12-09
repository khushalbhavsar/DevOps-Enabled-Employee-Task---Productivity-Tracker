#!/bin/bash

# Jenkins Build Script for Local Testing

set -e

echo "===== Employee Productivity Tracker - Build Script ====="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build Backend
echo -e "${GREEN}Building Backend...${NC}"
cd backend
npm ci
npm test
cd ..

# Build Frontend
echo -e "${GREEN}Building Frontend...${NC}"
cd frontend
npm ci
npm test -- --watchAll=false
npm run build
cd ..

# Build Docker Images
echo -e "${GREEN}Building Docker Images...${NC}"
docker build -t productivity-backend:latest ./backend
docker build -t productivity-frontend:latest ./frontend

echo -e "${GREEN}Build completed successfully!${NC}"
