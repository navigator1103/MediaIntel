# Quick Restoration Guide

## 🚀 Fast Recovery Commands

### 1. Complete Project Restoration (5 minutes)
```bash
# Extract source code
tar -xzf source/complete_source_code.tar.gz -C /path/to/new/project/

# Copy database files
cp database/golden_rules_main.db /path/to/new/project/golden_rules.db
cp database/golden_rules_prisma.db /path/to/new/project/prisma/golden_rules.db

# Setup project
cd /path/to/new/project/
npm ci
npx prisma generate
npm run build
```

### 2. Redeploy to Cloud Run (10 minutes)
```bash
# Ensure you're in the project directory with restored files
gcloud builds submit --config cloudbuild.simple.yaml .
```

### 3. Local Development Setup
```bash
# After restoration, run locally
npm run dev
# Access at http://localhost:3000
```

## 🔍 Verification Steps

1. **Database Check:**
   ```bash
   sqlite3 golden_rules.db "SELECT COUNT(*) FROM game_plans;"
   ```

2. **Build Check:**
   ```bash
   npm run build
   ```

3. **Health Check:**
   ```bash
   curl https://golden-rules-app-yp3b4auata-uc.a.run.app
   ```

## 📞 Emergency Contacts

- **Live URL:** https://golden-rules-app-yp3b4auata-uc.a.run.app
- **Backup Date:** June 23, 2025
- **Project ID:** smart-inn-450817-m9