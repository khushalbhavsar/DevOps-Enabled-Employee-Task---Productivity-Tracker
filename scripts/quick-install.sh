#!/bin/bash

################################################################################
# Quick Install Menu for DevOps Tools on EC2
# Provides interactive menu to choose installation type
################################################################################

clear

cat <<'EOF'
════════════════════════════════════════════════════════════════
            🚀 EC2 DevOps Stack Installation Menu
════════════════════════════════════════════════════════════════
EOF

echo ""
echo "Select installation type:"
echo ""
echo "  1) All-in-One      - Install everything on one EC2"
echo "                       (Jenkins + SonarQube + Monitoring)"
echo "                       Requires: t3.xlarge, 16GB RAM"
echo ""
echo "  2) Jenkins Only    - Install Jenkins + Docker + Maven"
echo "                       Requires: t3.large, 8GB RAM"
echo ""
echo "  3) SonarQube Only  - Install SonarQube + PostgreSQL"
echo "                       Requires: t3.medium, 4GB RAM"
echo ""
echo "  4) Monitoring Only - Install Grafana + Prometheus + Node Exporter"
echo "                       Requires: t3.medium, 4GB RAM"
echo ""
echo "  5) CPU Stress Test - Run CPU stress test for monitoring"
echo ""
echo "  6) Exit"
echo ""
read -p "Enter your choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "Installing All-in-One DevOps Stack..."
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        if [ -f "./setup-all-in-one-ec2.sh" ]; then
            chmod +x ./setup-all-in-one-ec2.sh
            ./setup-all-in-one-ec2.sh
        else
            echo "Error: setup-all-in-one-ec2.sh not found!"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "Installing Jenkins..."
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        read -p "Enter Git User Name [DevOps User]: " git_name
        read -p "Enter Git User Email [devops@example.com]: " git_email
        
        export GIT_USER_NAME="${git_name:-DevOps User}"
        export GIT_USER_EMAIL="${git_email:-devops@example.com}"
        
        if [ -f "./setup-jenkins-ec2.sh" ]; then
            chmod +x ./setup-jenkins-ec2.sh
            ./setup-jenkins-ec2.sh
        else
            echo "Error: setup-jenkins-ec2.sh not found!"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "Installing SonarQube..."
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        read -s -p "Enter PostgreSQL password [SonarDB@123]: " db_pass
        echo ""
        
        export SONAR_DB_PASSWORD="${db_pass:-SonarDB@123}"
        
        if [ -f "./setup-sonarqube-ec2.sh" ]; then
            chmod +x ./setup-sonarqube-ec2.sh
            ./setup-sonarqube-ec2.sh
        else
            echo "Error: setup-sonarqube-ec2.sh not found!"
            exit 1
        fi
        ;;
    4)
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "Installing Monitoring Stack..."
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        if [ -f "./setup-monitoring-ec2.sh" ]; then
            chmod +x ./setup-monitoring-ec2.sh
            ./setup-monitoring-ec2.sh
        else
            echo "Error: setup-monitoring-ec2.sh not found!"
            exit 1
        fi
        ;;
    5)
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        echo "Running CPU Stress Test..."
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        if [ -f "./stress-test-cpu.sh" ]; then
            chmod +x ./stress-test-cpu.sh
            ./stress-test-cpu.sh
        else
            echo "Error: stress-test-cpu.sh not found!"
            exit 1
        fi
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac
