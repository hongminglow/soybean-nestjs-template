# 🚀 AWS EC2 Deployment Guide — Soybean NestJS Monorepo (All-in-Docker)

## 1. Phase 1: First Things on EC2 (AMAZON LINUX)

Because you see `ec2-user`, you are using **Amazon Linux** (not Ubuntu). The syntax `apt` does not exist on Amazon Linux! You must use `yum`.

Run these commands in your black terminal:

### Step 1.1: Install Docker & Git

```bash
# Update system (using yum instead of apt)
sudo yum update -y

# Install Git and Docker
sudo yum install -y git docker

# Amazon Linux requires you to start the Docker service manually!
sudo systemctl start docker
sudo systemctl enable docker

# Allow your ec2-user to run docker commands without typing 'sudo'
sudo usermod -a -G docker ec2-user

# Install Docker Compose manually
sudo mkdir -p /usr/local/lib/docker/cli-plugins/
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# VERY IMPORTANT: To make the usermod change take effect, log out and log back in, OR run this:
newgrp docker
```

_(You can verify it works by typing `docker compose version`)_

### Step 1.2: Add Swap Space (CRITICAL)

Your EC2 might freeze and crash during the Docker build if it's small (like `t3a.small`). Add fake RAM (Swap):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 1.3: Clone the Code

```bash
cd ~
git clone https://github.com/hongminglow/soybean-nestjs-template.git deploy-project
cd deploy-project
```

---

## 2. Phase 2: Dockerfile Fixes Before Building

There are bugs in the codebase that will prevent deployment. Let's fix them right now on the server.
Use `nano <filename>` to edit files.

### Fix 1: [backend/ecosystem.config.js](file:///c:/Users/User/OneDrive/Desktop/CodeTest/soybean-nestjs-template/backend/ecosystem.config.js)

The file has `instances: -1`. On a small instance, this equals 0 instances (app won't start).

```bash
nano backend/ecosystem.config.js
# Change: instances: -1   ->   instances: 1
# Save: Press Ctrl+O, Enter, Ctrl+X
```

### Fix 2: [backend/Dockerfile](file:///c:/Users/User/OneDrive/Desktop/CodeTest/soybean-nestjs-template/backend/Dockerfile) missing files

The `db-init` container needs your Prisma files, and the backend needs the casbin model.

```bash
nano backend/Dockerfile
```

Scroll to the bottom, right after `COPY --from=build ... ./dist`, add these two lines:

```dockerfile
COPY --from=build /usr/src/app/soybean/backend/prisma ./prisma
COPY --from=build /usr/src/app/soybean/backend/apps/base-system/src/resources/model.conf ./model.conf
```

### Fix 3: [docker-compose.yml](file:///c:/Users/User/OneDrive/Desktop/CodeTest/soybean-nestjs-template/docker-compose.yml) standardizing

```bash
nano docker-compose.yml
```

1. Under `postgres` service volumes, change `/usr/share/docker/postgresql` to standard `/var/lib/postgresql/data`
2. **Comment out `pgbouncer` service completely** (you don't need it right now and it often introduces connection issues for beginners).
3. Under the `frontend` and `backend` services, **comment out the `image:` lines** (so docker-compose knows to build from the directory instead of trying to pull from a registry). Make sure they have `build: context: frontend/` and `context: backend/`.

_(Note: The repo's composefile already has the `build:` tags, just ensure `image: soybean-admin-frontend...` is commented out)._

---

## 3. Phase 3: Deploy on EC2

Now, build and run everything! (We are skipping ECR pushing/pulling. We just build directly on the server).

```bash
cd ~/deploy-project

# Tell docker to build the images (this takes 5-10 minutes)
docker compose build

# Start the containers
docker compose up -d

# Watch the startup logs (press Ctrl+C to exit log view)
docker compose logs -f

# Check if everything is 'Up'
docker compose ps
```

**Verify it's working!**
Open your browser and visit: `http://<EC2_PUBLIC_IP>:9527`
Try to login!

---

## 4. Phase 4: Host-Level Nginx Reverse Proxy (Optional)

Right now, you access your app via Port `9527`. If you want to use the standard Port 80 (so you can just type `http://<EC2_PUBLIC_IP>` or a domain name), you install Nginx on the EC2 machine itself.

```bash
# On Amazon Linux:
sudo yum install -y nginx

sudo tee /etc/nginx/conf.d/sms-ap-dev.conf << 'EOF'
server {
    listen 80;
    # If you have a domain put it here, else use the IP or just underscore '_'
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:9527; # Forwards to the Docker frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx
```

Now you can visit `http://<EC2_PUBLIC_IP>` directly without `:9527`!

---
