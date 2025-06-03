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

# Create a temporary .env.production file for deployment
echo "Creating deployment environment configuration..."
cat > .env.production << EOL
DATABASE_URL=file:./prisma/golden_rules.db
NODE_ENV=production
EOL

# Build the container image locally
echo "Building container image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# Push the container image to Google Container Registry
echo "Pushing image to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars DATABASE_URL=file:./prisma/golden_rules.db,NODE_ENV=production \
  --set-volumes=name=db-volume,mount-path=/app/prisma,type=cloud-storage,bucket=$BUCKET_NAME

echo "Deployment complete! Your application should be available at:"
echo "https://$SERVICE_NAME-$(gcloud config get-value project | tr -d '\n').$REGION.run.app"

# Clean up temporary files
rm .env.production
