#!/bin/bash
# Script to set up GCP for deploying the Golden Rules Next.js application

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Google Cloud SDK is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "You are not logged in to Google Cloud. Please login:"
    gcloud auth login
fi

# Prompt for project ID
read -p "Enter your GCP Project ID: " PROJECT_ID

# Set the project
gcloud config set project $PROJECT_ID
echo "Project set to: $PROJECT_ID"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Create Artifact Registry repository
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create golden-rules-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for Golden Rules app"

# Configure Docker to use GCP authentication
echo "Configuring Docker to use GCP authentication..."
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and tag Docker image
echo "Building Docker image..."
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/golden-rules-repo/golden-rules-app:latest .

# Push Docker image to Artifact Registry
echo "Pushing Docker image to Artifact Registry..."
docker push us-central1-docker.pkg.dev/$PROJECT_ID/golden-rules-repo/golden-rules-app:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy golden-rules-app \
    --image us-central1-docker.pkg.dev/$PROJECT_ID/golden-rules-repo/golden-rules-app:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated

# Create a Cloud Storage bucket for database persistence
echo "Creating Cloud Storage bucket for database persistence..."
gsutil mb gs://$PROJECT_ID-golden-rules-db

# Update Cloud Run service to mount the storage bucket
echo "Updating Cloud Run service to mount the storage bucket..."
gcloud run services update golden-rules-app \
    --region=us-central1 \
    --add-volume name=db-volume,type=cloud-storage,bucket=$PROJECT_ID-golden-rules-db \
    --add-volume-mount volume=db-volume,mount-path=/app/prisma

# Set environment variables
echo "Setting environment variables..."
gcloud run services update golden-rules-app \
    --region=us-central1 \
    --set-env-vars DATABASE_URL=file:/app/prisma/dev.db

echo "Setup complete! Your application is now deployed to Cloud Run."
echo "You can access it at the URL provided in the deployment output above."
