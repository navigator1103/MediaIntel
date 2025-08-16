# Excel Template Update Guide - Cloud Storage Method

## Overview
This guide explains how to update Excel templates in the Media Sufficiency Platform without redeploying the entire application. By using Google Cloud Storage, you can update templates instantly with zero downtime.

## Architecture
- **Current Setup**: Templates are baked into the Docker container at build time
- **New Setup**: Templates are served from Cloud Storage, allowing instant updates
- **Application Impact**: Zero - the application code remains unchanged

## Initial Setup (One-Time Only)

### Prerequisites
- Google Cloud SDK installed and authenticated
- Access to the `goldenrulesnextjs` GCP project
- Local copies of the Excel templates in `public/templates/`

### Step 1: Run the Safe Setup Script
This script will:
1. Upload your current local templates to Cloud Storage
2. Configure Cloud Run to read templates from Cloud Storage
3. Preserve existing functionality with zero disruption

```bash
./setup-templates-safe.sh
```

### Step 2: Verify the Setup
1. Visit the application: https://golden-rules-app-434924699594.us-central1.run.app
2. Navigate to the Game Plans upload page
3. Download a template to verify it works correctly
4. Confirm all templates are accessible

## Updating Templates (After Setup)

### Option 1: Update Specific Templates
To update individual template files:

```bash
# Update NIVEA template
./update-single-template.sh "NIVEA_ABP2026_Nebula_Templates.xlsx"

# Update DERMA template
./update-single-template.sh "DERMA_ABP2026_Nebula_Templates.xlsx"

# Update any other template
./update-single-template.sh "Game_Plans_Template.xlsx"
```

### Option 2: Update All Templates at Once
To update all templates in the `public/templates/` directory:

```bash
./update-templates.sh
```

### Option 3: Manual Update via gsutil
For direct Cloud Storage manipulation:

```bash
# Upload a single file
gsutil cp "NIVEA_ABP2026_Nebula_Templates.xlsx" gs://goldenrulesnextjs-db/templates/

# Upload multiple files
gsutil -m cp public/templates/*.xlsx gs://goldenrulesnextjs-db/templates/

# List current templates in Cloud Storage
gsutil ls gs://goldenrulesnextjs-db/templates/
```

## How It Works

### Technical Details
1. **Cloud Storage Mount**: Cloud Run mounts the Cloud Storage bucket at `/app/public/templates/`
2. **Transparent Override**: The mounted storage overlays the container's built-in templates
3. **No Code Changes**: Application still references `/templates/filename.xlsx` as before
4. **Instant Updates**: Changes to Cloud Storage are immediately reflected in the app

### File Paths
- **Local Directory**: `public/templates/`
- **Cloud Storage Path**: `gs://goldenrulesnextjs-db/templates/`
- **Application URL**: `https://golden-rules-app-434924699594.us-central1.run.app/templates/[filename]`
- **Direct Storage URL**: `https://storage.googleapis.com/goldenrulesnextjs-db/templates/[filename]`

## Scripts Reference

### setup-templates-safe.sh
- **Purpose**: Initial one-time setup
- **Actions**: 
  - Uploads current templates to Cloud Storage
  - Configures Cloud Run volume mount
  - Handles project switching automatically

### update-single-template.sh
- **Purpose**: Update individual template files
- **Usage**: `./update-single-template.sh "filename.xlsx"`
- **Use Case**: When you need to update specific templates only

### update-templates.sh
- **Purpose**: Batch update all templates
- **Actions**: Uploads all `.xlsx` files from `public/templates/`
- **Use Case**: When multiple templates need updating

## Troubleshooting

### Templates Not Updating
1. Verify the upload succeeded:
   ```bash
   gsutil ls -l gs://goldenrulesnextjs-db/templates/
   ```

2. Check Cloud Run volume mounts:
   ```bash
   gcloud run services describe golden-rules-app --region=us-central1 --format="value(spec.template.spec.volumes)"
   ```

3. Clear browser cache and retry

### Permission Issues
If you encounter permission errors:
```bash
# Ensure you're authenticated
gcloud auth login

# Verify project access
gcloud projects list | grep goldenrulesnextjs

# Set correct project
gcloud config set project goldenrulesnextjs
```

### Rollback Changes
To revert to a previous version of a template:
```bash
# List all versions of a file
gsutil ls -la gs://goldenrulesnextjs-db/templates/NIVEA_ABP2026_Nebula_Templates.xlsx

# Restore a previous version (replace GENERATION_NUMBER)
gsutil cp gs://goldenrulesnextjs-db/templates/NIVEA_ABP2026_Nebula_Templates.xlsx#GENERATION_NUMBER \
          gs://goldenrulesnextjs-db/templates/NIVEA_ABP2026_Nebula_Templates.xlsx
```

## Benefits

1. **Zero Downtime**: No application restart or redeployment needed
2. **Instant Updates**: Changes reflect immediately
3. **Version Control**: Cloud Storage maintains file version history
4. **Cost Effective**: No need to rebuild and redeploy containers
5. **Easy Rollback**: Previous versions are preserved in Cloud Storage
6. **Selective Updates**: Update only the templates you need

## Security Considerations

- Templates are publicly readable via direct Storage URLs
- Cloud Run service account has read access to the bucket
- No sensitive data should be included in template files
- Access control is managed through Cloud Storage IAM

## Important Notes

- The initial setup (`setup-templates-safe.sh`) only needs to be run **once**
- After setup, use the update scripts for all template changes
- Always test template updates in a non-critical timeframe
- Keep local copies of templates in sync with Cloud Storage

## Support

For issues or questions:
1. Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision"`
2. Verify Cloud Storage contents: `gsutil ls -l gs://goldenrulesnextjs-db/templates/`
3. Review the deployment guide: `GCP-Deployment.md`