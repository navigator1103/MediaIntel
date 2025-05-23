# Google Cloud Platform Deployment Guide

This guide provides step-by-step instructions for deploying the Golden Rules Next.js application to Google Cloud Platform (GCP).

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured
2. [Docker](https://docs.docker.com/get-docker/) installed on your local machine
3. A Google Cloud Platform account with billing enabled
4. A GCP project created

## Step 1: Set Up Your GCP Project

If you haven't already set up a GCP project, you can create one with:

```bash
gcloud projects create [PROJECT_ID] --name="Golden Rules App"
gcloud config set project [PROJECT_ID]
```

Enable the required APIs:

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Step 2: Create a Container Registry Repository

Create a repository in Artifact Registry:

```bash
gcloud artifacts repositories create golden-rules-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for Golden Rules app"
```

## Step 3: Build and Push the Docker Image

Authenticate Docker to GCP:

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

Build and tag your Docker image:

```bash
docker build -t us-central1-docker.pkg.dev/[PROJECT_ID]/golden-rules-repo/golden-rules-app:latest .
```

Push the image to Artifact Registry:

```bash
docker push us-central1-docker.pkg.dev/[PROJECT_ID]/golden-rules-repo/golden-rules-app:latest
```

## Step 4: Deploy to Cloud Run

Deploy the application to Cloud Run:

```bash
gcloud run deploy golden-rules-app \
    --image us-central1-docker.pkg.dev/[PROJECT_ID]/golden-rules-repo/golden-rules-app:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

## Step 5: Set Up Environment Variables

For SQLite database persistence in Cloud Run, you'll need to:

1. Create a Cloud Storage bucket for the database file:

```bash
gsutil mb gs://[PROJECT_ID]-golden-rules-db
```

2. Update your deployment to mount the storage bucket:

```bash
gcloud run services update golden-rules-app \
    --add-volume name=db-volume,type=cloud-storage,bucket=[PROJECT_ID]-golden-rules-db \
    --add-volume-mount volume=db-volume,mount-path=/app/prisma
```

3. Set environment variables:

```bash
gcloud run services update golden-rules-app \
    --set-env-vars DATABASE_URL=file:/app/prisma/dev.db
```

## Step 6: Set Up a Custom Domain (Optional)

If you want to use a custom domain:

1. Verify domain ownership in Google Cloud Console
2. Map the domain to your Cloud Run service:

```bash
gcloud run domain-mappings create \
    --service golden-rules-app \
    --domain app.yourdomain.com \
    --region us-central1
```

## Step 7: Set Up Continuous Deployment (Optional)

1. Connect your GitHub repository to Cloud Build
2. Create a Cloud Build trigger to automatically deploy on code changes
3. Configure the build steps in a `cloudbuild.yaml` file

## Database Considerations

For production use, consider:

1. Migrating from SQLite to Cloud SQL (PostgreSQL or MySQL)
2. Updating the Prisma schema to use the new database provider
3. Setting up proper database migrations

## Monitoring and Scaling

- Use Cloud Monitoring to set up alerts and dashboards
- Cloud Run automatically scales based on traffic
- Set minimum and maximum instances for cost control:

```bash
gcloud run services update golden-rules-app \
    --min-instances=1 \
    --max-instances=10
```

## Security Best Practices

1. Use Secret Manager for sensitive environment variables
2. Set up IAM roles with least privilege
3. Enable Cloud Audit Logging
4. Implement VPC Service Controls for additional security
