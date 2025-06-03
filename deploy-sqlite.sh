#!/bin/bash
set -e

# Set project ID
PROJECT_ID="goldenrulesnextjs"
REGION="us-central1"
SERVICE_NAME="golden-rules-app"
BUCKET_NAME="goldenrulesnextjs-db"

# Ensure we're using the right project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Check if the bucket exists, if not create it
echo "Checking if storage bucket exists..."
if ! gsutil ls -b gs://$BUCKET_NAME &>/dev/null; then
  echo "Creating storage bucket $BUCKET_NAME..."
  gsutil mb -l $REGION gs://$BUCKET_NAME
fi

# Copy the SQLite database to the bucket
echo "Copying SQLite database to Cloud Storage..."
gsutil cp ./prisma/golden_rules.db gs://$BUCKET_NAME/

# Build and deploy using Cloud Build
echo "Building and deploying to Cloud Run..."
gcloud builds submit --config cloudbuild.sqlite.yaml .

echo "Deployment complete! Your application should be available at:"
echo "https://$SERVICE_NAME-$(gcloud config get-value project | tr -d '\n').a.run.app"
