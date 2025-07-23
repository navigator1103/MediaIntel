# Media Sufficiency Platform - Deployment Backup

**Backup Date:** June 23, 2025 01:58:49 UTC  
**Deployment Status:** Successfully deployed to Google Cloud Run  
**Live URL:** https://golden-rules-app-yp3b4auata-uc.a.run.app

## Backup Contents

### 📁 Database (`/database/`)
- `golden_rules_main.db` - Main SQLite database from project root
- `golden_rules_prisma.db` - Prisma SQLite database from prisma/ directory
- `golden_rules_backup.sql` - Complete SQL dump for restoration

### 📁 Source Code (`/source/`)
- `complete_source_code.tar.gz` - Full source code archive (excluding node_modules, .next, logs)

### 📁 Docker & Deployment (`/docker/`)
- `Dockerfile` - Container build configuration
- `cloudbuild.yaml` - Original Cloud Build configuration (buildpack)
- `cloudbuild.simple.yaml` - Working Cloud Build configuration (Docker)
- `.dockerignore` - Docker ignore rules
- `app.yaml` - App Engine configuration (alternative)
- `cloud_run_service_config.yaml` - Current Cloud Run service configuration

### 📁 Logs (`/logs/`)
- `recent_builds.yaml` - Recent Cloud Build history

### 📁 Documentation (`/documentation/`)
- This README file with restoration instructions

## Deployment Architecture

### Google Cloud Configuration
- **Project ID:** smart-inn-450817-m9
- **Region:** us-central1
- **Service Name:** golden-rules-app
- **Container Registry:** us-central1-docker.pkg.dev/smart-inn-450817-m9/golden-rules-repo/golden-rules-app:latest

### Technical Stack
- **Runtime:** Node.js 20 Alpine
- **Framework:** Next.js 15.3.2
- **Database:** SQLite (included in container)
- **ORM:** Prisma
- **Platform:** Google Cloud Run (serverless)

### Resources
- **CPU:** 1 vCPU
- **Memory:** 1GB RAM
- **Port:** 8080
- **Concurrency:** Default Cloud Run settings

## Key Features Deployed

### ✅ Recent Enhancements (Included in this deployment)
1. **Total WOA and Weeks Off Air fields** added to GamePlans schema
2. **Enhanced validation system** with derma category mappings
3. **Campaign compatibility system** for multi-range campaigns
4. **Comprehensive category-range validation**
5. **PostgreSQL cleanup** - pure SQLite deployment

### Core Functionality
- Media Sufficiency CSV upload and validation
- Game Plans management with budget tracking
- Enhanced data validation engine
- Analytics dashboard with charts
- User management and role-based access
- Financial cycle management

## Database Schema Summary

### Key Tables
- **GamePlans** - Core campaign data with new totalWoa and weeksOffAir fields
- **Campaigns** - Campaign definitions with range relationships
- **Categories/Ranges** - Many-to-many relationships via CategoryToRange
- **Countries/Regions** - Geographic hierarchy
- **MediaTypes/MediaSubTypes** - Media classification
- **Users** - Authentication and access control

### Recent Schema Changes
```sql
-- Added to GamePlans table
totalWoa         Float?       @map("total_woa")
weeksOffAir      Float?       @map("weeks_off_air")
```

## Restoration Instructions

### 1. Database Restoration
```bash
# Option A: Copy SQLite files directly
cp database/golden_rules_main.db ./golden_rules.db
cp database/golden_rules_prisma.db ./prisma/golden_rules.db

# Option B: Restore from SQL dump
sqlite3 new_database.db < database/golden_rules_backup.sql
```

### 2. Source Code Restoration
```bash
# Extract source code
tar -xzf source/complete_source_code.tar.gz

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build application
npm run build
```

### 3. Redeploy to Cloud Run
```bash
# Using the working build configuration
gcloud builds submit --config docker/cloudbuild.simple.yaml .

# Or manual Docker approach
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/golden-rules-repo/golden-rules-app:latest .
docker push us-central1-docker.pkg.dev/PROJECT_ID/golden-rules-repo/golden-rules-app:latest
gcloud run deploy golden-rules-app --image us-central1-docker.pkg.dev/PROJECT_ID/golden-rules-repo/golden-rules-app:latest --region us-central1
```

### 4. Restore Service Configuration
```bash
# Apply the exact same service configuration
gcloud run services replace docker/cloud_run_service_config.yaml --region=us-central1
```

## Environment Variables

### Required for Deployment
```
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
DATABASE_URL=file:./golden_rules.db
```

## Authentication Credentials

### Demo Users (for testing)
- **Admin:** admin@example.com / admin
- **User:** user@example.com / user

## Important Notes

1. **Database Persistence:** SQLite database is included in the container - data persists until container replacement
2. **Scaling:** Cloud Run will create new instances as needed, each with a copy of the database
3. **Data Sync:** For production use, consider external database for data consistency across instances
4. **Backups:** Regular backups recommended before major deployments

## Support Information

- **Last Successful Deployment:** June 23, 2025
- **Git Commit:** Latest commit includes Total WOA and Weeks Off Air fields
- **Build Status:** SUCCESS
- **Health Check:** https://golden-rules-app-yp3b4auata-uc.a.run.app

---

*This backup was created automatically after successful deployment to Google Cloud Run.*