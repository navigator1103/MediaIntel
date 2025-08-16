#!/bin/bash

# One-time setup to mount Cloud Storage templates directory to Cloud Run
# Run this ONCE to configure the Cloud Run service

set -e

PROJECT_ID="goldenrulesnextjs"
SERVICE_NAME="golden-rules-app"
REGION="us-central1"
BUCKET_NAME="goldenrulesnextjs-db"

echo "🔧 Setting up Cloud Storage mount for templates..."
echo "================================================"

# Update Cloud Run service to mount templates from Cloud Storage
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --add-volume name=templates-volume,type=cloud-storage,bucket=$BUCKET_NAME \
    --add-volume-mount volume=templates-volume,mount-path=/app/public/templates

echo "✅ Cloud Storage mount configured successfully!"
echo ""
echo "Now you can use ./update-templates.sh to update templates without redeployment."