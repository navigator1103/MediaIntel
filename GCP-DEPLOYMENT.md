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

## Step 3: Deploy Using Cloud Build (Recommended)

Instead of manual Docker builds, we use **Cloud Build** for automated source-to-container deployment:

```bash
# Deploy directly from source code using Cloud Build
gcloud builds submit --config cloudbuild.sqlite.yaml
```

This single command:
- Builds the Docker image from source
- Pushes to Google Container Registry (GCR) 
- Deploys to Cloud Run with proper configuration
- Mounts Cloud Storage for database persistence

## Step 4: Alternative Manual Docker Deployment (Not Recommended)

If you need manual control, you can still use traditional Docker commands:

```bash
# Authenticate Docker to GCP
gcloud auth configure-docker gcr.io

# Build and tag Docker image  
docker build -t gcr.io/[PROJECT_ID]/golden-rules-app:latest .

# Push to Container Registry
docker push gcr.io/[PROJECT_ID]/golden-rules-app:latest

# Deploy to Cloud Run
gcloud run deploy golden-rules-app \
    --image gcr.io/[PROJECT_ID]/golden-rules-app:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1
```

**Note**: Manual deployment requires additional steps to configure Cloud Storage mounting and environment variables.

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

## Critical Database Fix for Production Deployment

⚠️ **IMPORTANT**: Before deploying, you must handle the database schema synchronization issue.

### The Problem
The production environment may have an outdated SQLite database that's missing critical schema updates (such as the `campaign_archetype_id` column). This causes the application to crash with database errors.

### The Solution
Always upload your complete local database to Cloud Storage before deploying:

```bash
# Upload the complete local database with all schema updates
gsutil cp prisma/golden_rules.db gs://goldenrulesnextjs-db/golden_rules.db
```

### Verification Commands
Verify your local database has the required data before uploading:

```bash
# Check media types and subtypes
sqlite3 prisma/golden_rules.db "SELECT COUNT(*) as media_types FROM media_types;"
sqlite3 prisma/golden_rules.db "SELECT COUNT(*) as media_subtypes FROM media_sub_types;"

# Check for critical columns
sqlite3 prisma/golden_rules.db "PRAGMA table_info(game_plans);" | grep campaign_archetype_id
```

### Actual Deployment Method Used
We use **Cloud Build** for automated source-to-container deployment, not manual Docker builds. Here's the exact process:

#### Cloud Build Configuration
The deployment uses `cloudbuild.sqlite.yaml` which handles:
- Building the Docker container from source
- Pushing to Google Container Registry (GCR)  
- Deploying to Cloud Run with proper configuration

#### Production Deployment Script
This is the exact script used for successful deployment:

```bash
#!/bin/bash
# Production deployment script - used successfully on 2025-07-22

# Step 1: Upload complete local database to Cloud Storage
echo "🔄 Uploading local database to Cloud Storage..."
gsutil cp prisma/golden_rules.db gs://goldenrulesnextjs-db/golden_rules.db

# Step 2: Verify database upload
echo "✅ Verifying database upload..."
gsutil ls -l gs://goldenrulesnextjs-db/golden_rules.db

# Step 3: Deploy using Cloud Build (source-to-container)
echo "🚀 Starting Cloud Build deployment..."
gcloud builds submit --config cloudbuild.sqlite.yaml

# Step 4: Get service URL
echo "📊 Getting service URL..."
echo "Service URL: https://golden-rules-app-434924699594.us-central1.run.app"
```

#### Cloud Run Service Details
- **Service Name**: `golden-rules-app`
- **Project ID**: `goldenrulesnextjs` 
- **Project Number**: `434924699594`
- **Region**: `us-central1`
- **Platform**: `managed`
- **Service URL**: `https://golden-rules-app-434924699594.us-central1.run.app`
- **Memory**: `512Mi`
- **CPU**: `1`
- **Cloud Storage Bucket**: `goldenrulesnextjs-db`

#### Key Configuration in cloudbuild.sqlite.yaml
```yaml
# Deploy container image to Cloud Run
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: gcloud
  args:
    - 'run'
    - 'deploy'
    - 'golden-rules-app'
    - '--image=gcr.io/$PROJECT_ID/golden-rules-app:latest'
    - '--region=us-central1'
    - '--platform=managed'
    - '--allow-unauthenticated'
    - '--memory=512Mi'
    - '--cpu=1'
    - '--set-env-vars=DATABASE_URL=file:./prisma/golden_rules.db,NODE_ENV=production'
    - '--add-volume=name=db-volume,type=cloud-storage,bucket=goldenrulesnextjs-db'
    - '--add-volume-mount=volume=db-volume,mount-path=/app/prisma'
```

#### Why Source Deployment vs Manual Docker
- **Automated**: Single command deploys everything
- **Consistent**: Same build environment every time
- **Integrated**: Handles GCR push and Cloud Run deployment automatically
- **Traceable**: Complete build logs in Cloud Console

### Why This Fix is Critical
- **Schema Synchronization**: Ensures production database matches your local development schema
- **Feature Compatibility**: Prevents missing column errors that crash the application  
- **Data Integrity**: Preserves all master data, relationships, and configurations
- **Zero Downtime**: Avoids deployment rollbacks due to database issues

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
