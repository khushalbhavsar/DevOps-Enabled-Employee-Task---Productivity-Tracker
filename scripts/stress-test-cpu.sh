#!/bin/bash

################################################################################
# CPU Stress Test Script
# Purpose: Increase CPU usage to test monitoring alerts
# Usage: ./stress-test-cpu.sh
# Stop: Press CTRL + C
################################################################################

echo "========================================"
echo "🔥 CPU Utilization Booster"
echo "========================================"
echo "This script will increase CPU usage beyond 80%"
echo "Press CTRL + C to stop."
echo ""

# Detect number of CPU cores
CORES=$(nproc)
echo "Detected CPU Cores: $CORES"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "========================================"
    echo "🛑 Stopping CPU stress test..."
    echo "========================================"
    # Kill all background jobs started by this script
    jobs -p | xargs -r kill 2>/dev/null
    echo "✅ All stress processes terminated"
    exit 0
}

# Trap CTRL+C and call cleanup
trap cleanup SIGINT SIGTERM

echo "Starting CPU load on all $CORES cores..."
echo "Run 'top' or 'htop' to verify CPU usage."
echo ""
echo "========================================"

# Start load on all cores
for i in $(seq 1 $CORES); do
    # Infinite loop that consumes CPU
    while true; do :; done &
done

echo "✅ CPU load started on all $CORES cores"
echo ""
echo "Monitoring Instructions:"
echo "  - Open another terminal"
echo "  - Run: top"
echo "  - Or run: htop (if installed)"
echo "  - Check Prometheus alerts at: http://<EC2-IP>:9090/alerts"
echo "  - Check Grafana dashboards at: http://<EC2-IP>:3000"
echo ""
echo "Press CTRL + C to stop the stress test"
echo "========================================"

# Wait indefinitely (until CTRL+C)
wait
