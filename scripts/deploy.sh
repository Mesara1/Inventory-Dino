#!/bin/bash
# Deploy / update บน VM
# ใช้: bash scripts/deploy.sh          (update)
# ใช้: bash scripts/deploy.sh --seed   (ครั้งแรก)

set -e
cd ~/Inventory-Dino

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Building and starting services ==="
docker compose -f docker-compose.prod.yml up -d --build

if [ "$1" == "--seed" ]; then
  echo "=== Waiting for DB to be ready ==="
  sleep 10
  echo "=== Seeding database ==="
  docker compose -f docker-compose.prod.yml exec backend ./seed
fi

VM_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "=== Deployed! ==="
echo "App running at: http://$VM_IP"
