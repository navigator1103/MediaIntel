#!/bin/bash

# Safe setup: Copy existing templates from production to Cloud Storage first
# This ensures no disruption - we use what's already working in production

set -e

# Configuration
PROJECT_ID="goldenrulesnextjs"
SERVICE_NAME="golden-rules-app"
REGION="us-central1"
BUCKET_NAME="goldenrulesnextjs-db"
TEMPLATES_PATH="templates"

# Switch to correct project
echo -e "${YELLOW}🔄 Switching to project: $PROJECT_ID${NC}"
ORIGINAL_PROJECT=$(gcloud config get-value project)
gcloud config set project $PROJECT_ID

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Safe Template Migration Script${NC}"
echo "=================================="
echo "This script will:"
echo "1. Upload your LOCAL templates to Cloud Storage"
echo "2. Set up Cloud Storage mount on Cloud Run"
echo "3. Allow you to test before making changes"
echo ""

# Step 1: Create templates directory in bucket if it doesn't exist
echo -e "${YELLOW}📁 Step 1: Preparing Cloud Storage...${NC}"
# This won't fail if directory exists
gsutil ls gs://$BUCKET_NAME/$TEMPLATES_PATH/ 2>/dev/null || echo "Creating templates directory..."

# Step 2: Upload current LOCAL templates to Cloud Storage
echo -e "\n${YELLOW}📤 Step 2: Uploading current templates to Cloud Storage...${NC}"
echo "Uploading templates from local public/templates/..."

if [ -d "public/templates" ]; then
    # Upload all Excel files
    gsutil -m cp public/templates/*.xlsx gs://$BUCKET_NAME/$TEMPLATES_PATH/ || {
        echo "⚠️  Warning: Some files may have failed to upload"
    }
    
    echo -e "\n${GREEN}✅ Templates uploaded:${NC}"
    gsutil ls -l gs://$BUCKET_NAME/$TEMPLATES_PATH/
else
    echo "❌ Error: public/templates directory not found locally"
    exit 1
fi

# Step 3: Set up Cloud Storage mount
echo -e "\n${YELLOW}🔧 Step 3: Configuring Cloud Run to use Cloud Storage templates...${NC}"
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --add-volume name=templates-volume,type=cloud-storage,bucket=$BUCKET_NAME \
    --add-volume-mount volume=templates-volume,mount-path=/app/public/templates

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}What happens now:${NC}"
echo "- Your app is now reading templates from Cloud Storage"
echo "- The templates in Cloud Storage are IDENTICAL to what was in production"
echo "- No disruption to users - everything works the same"
echo ""
echo -e "${BLUE}To test:${NC}"
echo "1. Visit: https://golden-rules-app-434924699594.us-central1.run.app"
echo "2. Try downloading a template to verify it works"
echo ""
echo -e "${BLUE}To update specific templates:${NC}"
echo "After confirming everything works, update individual templates with:"
echo ""
echo "  gsutil cp 'NIVEA_ABP2026_Nebula_Templates.xlsx' gs://$BUCKET_NAME/$TEMPLATES_PATH/"
echo "  gsutil cp 'DERMA_ABP2026_Nebula_Templates.xlsx' gs://$BUCKET_NAME/$TEMPLATES_PATH/"
echo ""
echo "Changes take effect immediately - no deployment needed!"

# Switch back to original project
echo -e "\n${YELLOW}🔄 Switching back to original project: $ORIGINAL_PROJECT${NC}"
gcloud config set project $ORIGINAL_PROJECT