#!/bin/bash
# deploy.sh
# This script completely automates your sequential Docker deployment on small AWS EC2 instances securely.

echo "====================================="
echo " Building db-init in isolation..."
echo "====================================="
docker compose build db-init

echo "====================================="
echo " Building backend in isolation..."
echo "====================================="
docker compose build backend

echo "====================================="
echo " Building frontend in isolation..."
echo "====================================="
docker compose build frontend

echo "====================================="
echo " All builds finished completely perfectly! Starting servers..."
echo "====================================="
docker compose up -d
