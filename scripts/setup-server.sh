#!/bin/bash
# รันครั้งแรกบน Oracle Cloud VM (Ubuntu 22.04)

set -e

echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

echo "=== Installing Docker Compose plugin ==="
sudo apt-get install -y docker-compose-plugin

echo "=== Installing Git ==="
sudo apt-get install -y git

echo "=== Done! ==="
echo "Log out and back in, then run: bash scripts/deploy.sh --seed"
