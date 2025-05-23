# Docker Deployment Guide for Golden Rules Next.js Application

This guide explains how to deploy the Golden Rules Next.js application using Docker to various cloud platforms.

## Prerequisites

- Docker and Docker Compose installed on your local machine
- Access to a cloud platform (AWS, Google Cloud, Azure, DigitalOcean, etc.)
- Git repository access

## Environment Variables

The application requires the following environment variables:

```
DATABASE_URL=file:/app/prisma/dev.db
# Add any other required environment variables here
```

## Local Docker Deployment

1. Build and start the Docker containers:

```bash
docker-compose up -d --build
```

2. Access the application at http://localhost:3000

## Cloud Deployment Options

### Option 1: AWS Elastic Container Service (ECS)

1. Create an ECR repository
2. Build and push your Docker image:

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
docker build -t <aws-account-id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:latest .
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/<repository-name>:latest
```

3. Create an ECS cluster, task definition, and service to run the container

### Option 2: Google Cloud Run

1. Build and push your Docker image:

```bash
gcloud auth configure-docker
docker build -t gcr.io/<project-id>/<image-name>:latest .
docker push gcr.io/<project-id>/<image-name>:latest
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy --image gcr.io/<project-id>/<image-name>:latest --platform managed
```

### Option 3: Azure Container Instances

1. Create an Azure Container Registry (ACR)
2. Build and push your Docker image:

```bash
az acr login --name <acr-name>
docker build -t <acr-name>.azurecr.io/<image-name>:latest .
docker push <acr-name>.azurecr.io/<image-name>:latest
```

3. Deploy to Azure Container Instances:

```bash
az container create --resource-group <resource-group> --name <container-name> --image <acr-name>.azurecr.io/<image-name>:latest --dns-name-label <dns-name> --ports 3000
```

### Option 4: DigitalOcean App Platform

1. Push your code to a GitHub repository
2. Connect your GitHub repository to DigitalOcean App Platform
3. Select the Dockerfile as the build method
4. Configure environment variables
5. Deploy the application

## Database Considerations

The application is currently configured to use SQLite with a persistent volume. For production deployments, consider:

1. Using a managed database service (PostgreSQL, MySQL)
2. Updating the Prisma schema to use the new database provider
3. Setting up proper database migrations

## Monitoring and Scaling

- Set up monitoring using the cloud provider's tools
- Configure auto-scaling based on traffic patterns
- Implement health checks for container orchestration

## Security Considerations

- Use secrets management for sensitive environment variables
- Implement HTTPS for all traffic
- Regularly update dependencies and Docker images
