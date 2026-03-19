#!/bin/bash
# deploy.sh
# Sequential Deployment + Disk Space Protection for small AWS EC2 instances.

# 1. Stop if ANY command fails!
set -e

echo "====================================="
echo " 1. Checking Hard Drive Space..."
echo "====================================="
# Returns space in 1K blocks
FREE_BLOCKS=$(df / | awk 'NR==2 {print $4}')

# 1GB is roughly 1,000,000 blocks.
if [ "$FREE_BLOCKS" -lt 1000000 ]; then
  echo "CRITICAL WARNING: You have less than 1GB left on your disk!"
  echo "Please run: 'docker system prune -a --volumes -f' first to clear space."
  exit 1
fi
echo "Available Disk Space: OK"

echo "====================================="
echo " 2. Building db-init in isolation..."
echo "====================================="
docker compose build db-init

echo "====================================="
echo " 3. Building backend in isolation..."
echo "====================================="
docker compose build backend

echo "====================================="
echo " 4. Building frontend in isolation..."
echo "====================================="
docker compose build frontend

echo "====================================="
echo " 5. Starting all servers..."
echo "====================================="
docker compose up -d

echo "====================================="
echo " DEPLOYMENT SUCCESSFUL! "
echo "====================================="
