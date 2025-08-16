#!/bin/bash

# Update a single Excel template file in Cloud Storage
# Usage: ./update-single-template.sh filename.xlsx

set -e

# Configuration
PROJECT_ID="goldenrulesnextjs"
BUCKET_NAME="goldenrulesnextjs-db"
TEMPLATES_PATH="templates"

# Switch to correct project
ORIGINAL_PROJECT=$(gcloud config get-value project)
gcloud config set project $PROJECT_ID

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if filename was provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Please provide a template filename${NC}"
    echo "Usage: ./update-single-template.sh filename.xlsx"
    echo ""
    echo "Available templates:"
    ls -1 public/templates/*.xlsx 2>/dev/null | xargs -n1 basename
    exit 1
fi

TEMPLATE_FILE="$1"
LOCAL_PATH="public/templates/$TEMPLATE_FILE"

# Check if file exists locally
if [ ! -f "$LOCAL_PATH" ]; then
    echo -e "${RED}❌ Error: File not found: $LOCAL_PATH${NC}"
    echo ""
    echo "Available templates:"
    ls -1 public/templates/*.xlsx 2>/dev/null | xargs -n1 basename
    exit 1
fi

# Upload the template
echo -e "${YELLOW}📤 Uploading $TEMPLATE_FILE to Cloud Storage...${NC}"
gsutil cp "$LOCAL_PATH" gs://$BUCKET_NAME/$TEMPLATES_PATH/

# Verify upload
echo -e "\n${YELLOW}✅ Verifying upload...${NC}"
gsutil ls -l gs://$BUCKET_NAME/$TEMPLATES_PATH/$TEMPLATE_FILE

echo -e "\n${GREEN}✅ Template updated successfully!${NC}"
echo "Changes are live immediately at:"
echo "https://golden-rules-app-434924699594.us-central1.run.app/templates/$TEMPLATE_FILE"

# Switch back to original project
gcloud config set project $ORIGINAL_PROJECT