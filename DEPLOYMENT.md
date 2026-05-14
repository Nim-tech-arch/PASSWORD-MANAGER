# 🚀 Deployment Guide

This guide covers deploying the Multi-User Password Manager API to various cloud platforms.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Setup](#docker-setup)
3. [Cloud Deployment](#cloud-deployment)
   - [Heroku](#heroku)
   - [AWS ECS](#aws-ecs)
   - [DigitalOcean App Platform](#digitalocean-app-platform)
   - [Google Cloud Run](#google-cloud-run)
4. [Production Checklist](#production-checklist)
5. [Monitoring & Scaling](#monitoring--scaling)

---

## Local Development

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd password-manager

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Build TypeScript
npm run build

# Start development server
npm run api:dev
```

### Local PostgreSQL Setup

**Option 1: Using Docker**
```bash
docker run -d \
  --name password-manager-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=password_manager \
  -p 5432:5432 \
  postgres:15-alpine
```

**Option 2: Native Installation**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb password_manager
```

---

## Docker Setup

### Build and Run

```bash
# Build image
docker build -t password-manager-api:latest .

# Run container
docker run -d \
  --name password-manager-api \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e JWT_SECRET=your-secret-key \
  password-manager-api:latest
```

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Remove volumes (WARNING: Deletes data)
docker-compose down -v
```

---

## Cloud Deployment

### Heroku

#### Prerequisites
- Heroku CLI installed
- Heroku account

#### Deployment Steps

```bash
# Login to Heroku
heroku login

# Create app
heroku create password-manager-api

# Add PostgreSQL add-on
heroku addons:create heroku-postgresql:standard-0 --app password-manager-api

# Set environment variables
heroku config:set NODE_ENV=production \
  JWT_SECRET=$(openssl rand -base64 32) \
  ENCRYPTION_KEY=$(openssl rand -base64 32) \
  --app password-manager-api

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate --app password-manager-api

# View logs
heroku logs --tail --app password-manager-api
```

#### Procfile (create in root directory)
```
web: node dist/api.js
worker: node dist/cli/index.js
```

---

### AWS ECS (Elastic Container Service)

#### Prerequisites
- AWS Account
- AWS CLI configured
- Docker image pushed to ECR

#### Step 1: Create ECR Repository

```bash
aws ecr create-repository --repository-name password-manager-api

# Tag and push image
docker tag password-manager-api:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/password-manager-api:latest
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/password-manager-api:latest
```

#### Step 2: Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier password-manager-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --publicly-accessible false
```

#### Step 3: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name password-manager

# Register task definition (create file: task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster password-manager \
  --service-name password-manager-api \
  --task-definition password-manager-api:1 \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Task Definition Example (task-definition.json)

```json
{
  "family": "password-manager-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "password-manager-api",
      "image": "<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/password-manager-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "<RDS_ENDPOINT>"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_NAME",
          "value": "password_manager"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:rds-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        },
        {
          "name": "ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:encryption-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/password-manager",
          "awslogs-region": "<REGION>",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

### DigitalOcean App Platform

#### Prerequisites
- DigitalOcean Account
- GitHub repository connected

#### Deployment Steps

1. Go to DigitalOcean App Platform
2. Create new app
3. Connect GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Run command: `node dist/api.js`
5. Add database:
   - Select PostgreSQL
   - Set max connections based on app size
6. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate-random>
   ENCRYPTION_KEY=<generate-random>
   DB_HOST=${db.HOSTNAME}
   DB_NAME=${db.DATABASE}
   DB_USER=${db.USERNAME}
   DB_PASSWORD=${db.PASSWORD}
   ```
7. Deploy

#### Auto-scaling Configuration

```yaml
services:
  - name: api
    http_port: 3000
    health_check:
      http_path: /health
    http_routes:
      - path: /
    autoscaling:
      min_instance_count: 2
      max_instance_count: 10
      target_cpu_utilization_percent: 70
```

---

### Google Cloud Run

#### Prerequisites
- Google Cloud Account
- gcloud CLI installed

#### Deployment Steps

```bash
# Set project
gcloud config set project PROJECT_ID

# Create Cloud SQL instance
gcloud sql instances create password-manager-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create password_manager \
  --instance=password-manager-db

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/password-manager-api

# Deploy to Cloud Run
gcloud run deploy password-manager-api \
  --image gcr.io/PROJECT_ID/password-manager-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --add-cloudsql-instances PROJECT_ID:us-central1:password-manager-db \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 100
```

---

## Production Checklist

### Security

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `ENCRYPTION_KEY` to a strong random value
- [ ] Change database password
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set `NODE_ENV=production`
- [ ] Enable CORS only for your domain
- [ ] Use environment variables for all secrets (never hardcode)
- [ ] Enable database encryption at rest
- [ ] Set up database backups

### Performance

- [ ] Configure database connection pooling
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression
- [ ] Configure caching headers
- [ ] Monitor database query performance
- [ ] Set up query logging
- [ ] Configure application logging
- [ ] Set up alerting for errors

### Monitoring

- [ ] Set up health checks
- [ ] Configure uptime monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure performance monitoring (New Relic, DataDog, etc.)
- [ ] Set up log aggregation (CloudWatch, Loggly, etc.)
- [ ] Configure alerts for critical metrics

### Database

- [ ] Enable automated backups
- [ ] Test backup/restore procedures
- [ ] Monitor disk space
- [ ] Set up database maintenance windows
- [ ] Configure connection limits
- [ ] Set up replication (for high availability)

---

## Monitoring & Scaling

### Health Checks

```bash
# Basic health check
curl https://api.example.com/health

# Expected response
{
  "status": "ok",
  "message": "Password Manager API is running",
  "timestamp": "2024-05-14T12:00:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Auto-scaling Metrics

- **CPU Usage**: Scale up at >70% utilization
- **Memory Usage**: Scale up at >80% utilization
- **Request Rate**: Scale up at >1000 requests/sec
- **Error Rate**: Alert if >5% of requests fail
- **Response Time**: Alert if p95 latency >2s

### Database Optimization

```sql
-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Index optimization
ANALYZE password_entries;
REINDEX INDEX idx_userId;

-- Connection monitoring
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
```

### Log Monitoring

```bash
# View application logs
docker-compose logs -f api

# Filter logs by level
docker-compose logs -f | grep ERROR

# Export logs
docker-compose logs api > logs.txt
```

---

## Rollback Procedures

### Docker Rollback

```bash
# Revert to previous image
docker-compose down
git revert <commit-hash>
docker-compose up -d
```

### Heroku Rollback

```bash
# View releases
heroku releases --app password-manager-api

# Rollback to previous version
heroku releases:rollback --app password-manager-api
```

### AWS ECS Rollback

```bash
# Update service with previous task definition
aws ecs update-service \
  --cluster password-manager \
  --service password-manager-api \
  --task-definition password-manager-api:PREVIOUS_VERSION
```

---

## Support & Troubleshooting

### Common Issues

**Database Connection Failed**
- Check database is running
- Verify DB_HOST, DB_PORT, credentials
- Check firewall/security group rules

**Out of Memory**
- Increase container memory
- Monitor node process
- Check for memory leaks

**Slow Responses**
- Check database query performance
- Monitor CPU utilization
- Review rate limiting logs

**High Error Rate**
- Check application logs
- Verify environment variables
- Check database connectivity

### Getting Help

- GitHub Issues: [Create issue]
- Documentation: [docs.example.com]
- Email: devops@example.com
