#!/bin/bash

# Create a backup of the Golden Rules Next.js project
# This script creates a comprehensive backup including the database

# Set variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/Users/naveedshah/Documents/Python/Projects/golden-rules-next/backups"
BACKUP_NAME="golden-rules-next_backup_${TIMESTAMP}"
PROJECT_DIR="/Users/naveedshah/Documents/Python/Projects/golden-rules-next"
DB_PATH="$(find ${PROJECT_DIR}/prisma -name "*.db" 2>/dev/null)"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Creating backup of Golden Rules Next.js project..."
echo "Timestamp: ${TIMESTAMP}"

# Check if database exists
if [ -z "$DB_PATH" ]; then
  echo "Warning: Could not find SQLite database file in prisma directory."
  echo "Checking for dev.db in default location..."
  DB_PATH="${PROJECT_DIR}/prisma/dev.db"
  if [ ! -f "$DB_PATH" ]; then
    echo "Warning: Could not find dev.db in default location."
    echo "Checking environment variable..."
    
    # Try to extract DB path from .env file if it exists
    if [ -f "${PROJECT_DIR}/.env" ]; then
      DB_URL=$(grep DATABASE_URL "${PROJECT_DIR}/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/^[[:space:]]*//')
      if [[ $DB_URL == file:* ]]; then
        DB_PATH=$(echo $DB_URL | sed 's/file://g')
        echo "Found database path in .env: $DB_PATH"
      else
        echo "Warning: DATABASE_URL in .env does not point to a file path."
      fi
    else
      echo "Warning: .env file not found."
    fi
  fi
fi

# Create a temporary directory for the backup
TEMP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "${TEMP_DIR}"

# Copy all project files except node_modules, .git, etc.
echo "Copying project files..."
rsync -av --progress "${PROJECT_DIR}/" "${TEMP_DIR}/" \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude backups

# If database was found, create a separate copy
if [ -f "$DB_PATH" ]; then
  echo "Backing up database from: $DB_PATH"
  DB_BACKUP_DIR="${TEMP_DIR}/db_backup"
  mkdir -p "${DB_BACKUP_DIR}"
  cp "$DB_PATH" "${DB_BACKUP_DIR}/$(basename $DB_PATH)"
  echo "Database backup created successfully."
else
  echo "Warning: No database file found to backup."
fi

# Create a README file with backup information
cat > "${TEMP_DIR}/BACKUP_INFO.md" << EOL
# Golden Rules Next.js Project Backup

**Backup Date:** $(date)
**Project:** Golden Rules Next.js

## Contents
- Project source code
- Configuration files
- Database backup (if found)

## Restoration Instructions
1. Extract this archive to your desired location
2. Run \`npm install\` to install dependencies
3. If database backup is included, copy it from the \`db_backup\` folder to your prisma directory
4. Update the \`.env\` file with your environment settings
5. Run \`npx prisma generate\` to generate Prisma client
6. Start the application with \`npm run dev\`

## Database Information
$(if [ -f "$DB_PATH" ]; then echo "Original database path: $DB_PATH"; else echo "No database was found during backup"; fi)
EOL

# Create zip archive
echo "Creating zip archive..."
cd "${BACKUP_DIR}"
zip -r "${BACKUP_NAME}.zip" "${BACKUP_NAME}"

# Remove temporary directory
rm -rf "${TEMP_DIR}"

echo "Backup completed successfully!"
echo "Backup saved to: ${BACKUP_DIR}/${BACKUP_NAME}.zip"
