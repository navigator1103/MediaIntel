#!/bin/bash

# Update Excel templates in Cloud Storage without redeploying the application
# This script uploads templates to Cloud Storage which are mounted by Cloud Run

set -e  # Exit on any error

# Configuration
PROJECT_ID="goldenrulesnextjs"
BUCKET_NAME="goldenrulesnextjs-db"
TEMPLATES_PATH="templates"
LOCAL_TEMPLATES_DIR="public/templates"

# Switch to correct project
ORIGINAL_PROJECT=$(gcloud config get-value project)
echo -e "${YELLOW}🔄 Switching to project: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📁 Excel Template Update Script${NC}"
echo "================================"

# Check if local templates directory exists
if [ ! -d "$LOCAL_TEMPLATES_DIR" ]; then
    echo "❌ Error: Templates directory not found at $LOCAL_TEMPLATES_DIR"
    exit 1
fi

# List files to be uploaded
echo -e "\n${YELLOW}Files to be uploaded:${NC}"
ls -la $LOCAL_TEMPLATES_DIR/*.xlsx 2>/dev/null || {
    echo "❌ No Excel files found in $LOCAL_TEMPLATES_DIR"
    exit 1
}

# Upload templates to Cloud Storage
echo -e "\n${YELLOW}📤 Uploading templates to Cloud Storage...${NC}"
gsutil -m cp $LOCAL_TEMPLATES_DIR/*.xlsx gs://$BUCKET_NAME/$TEMPLATES_PATH/

# Verify upload
echo -e "\n${YELLOW}✅ Verifying uploaded files:${NC}"
gsutil ls -l gs://$BUCKET_NAME/$TEMPLATES_PATH/

# Set public read access (if needed for direct downloads)
echo -e "\n${YELLOW}🔓 Setting public read access...${NC}"
gsutil -m acl ch -u AllUsers:R gs://$BUCKET_NAME/$TEMPLATES_PATH/*.xlsx

echo -e "\n${GREEN}✅ Templates updated successfully!${NC}"
echo -e "${GREEN}Changes will be reflected immediately in the running application.${NC}"
echo ""
echo "Template URLs:"
echo "- https://storage.googleapis.com/$BUCKET_NAME/$TEMPLATES_PATH/NIVEA_ABP2026_Nebula_Templates.xlsx"
echo "- https://storage.googleapis.com/$BUCKET_NAME/$TEMPLATES_PATH/DERMA_ABP2026_Nebula_Templates.xlsx"
echo "- https://storage.googleapis.com/$BUCKET_NAME/$TEMPLATES_PATH/Game_Plans_Template.xlsx"

# Switch back to original project
echo -e "\n${YELLOW}🔄 Switching back to original project: $ORIGINAL_PROJECT${NC}"
gcloud config set project $ORIGINAL_PROJECT