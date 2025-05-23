const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createFullBackup() {
  console.log('Creating full project backup...');
  
  // Get current timestamp for backup name
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `MiQ-backup-${timestamp}`;
  
  // Define paths
  const projectRoot = path.resolve(__dirname, '..');
  const backupDir = path.join(projectRoot, '..', backupName);
  
  try {
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`Created backup directory: ${backupDir}`);
    }
    
    // Copy all files except node_modules and .next
    console.log('Copying project files...');
    execSync(`rsync -a --exclude='node_modules' --exclude='.next' --exclude='data/sessions' "${projectRoot}/" "${backupDir}/"`);
    
    // Make sure the database is included
    const dbPath = path.join(projectRoot, 'prisma', 'golden_rules.db');
    const backupDbPath = path.join(backupDir, 'prisma', 'golden_rules.db');
    
    if (fs.existsSync(dbPath)) {
      console.log('Ensuring database is included in backup...');
      // Make sure the prisma directory exists in the backup
      const backupPrismaDir = path.join(backupDir, 'prisma');
      if (!fs.existsSync(backupPrismaDir)) {
        fs.mkdirSync(backupPrismaDir, { recursive: true });
      }
      
      // Copy the database file
      fs.copyFileSync(dbPath, backupDbPath);
      console.log(`Database copied to: ${backupDbPath}`);
    } else {
      console.warn('Warning: Database file not found at', dbPath);
    }
    
    // Create zip file
    console.log('Creating zip archive...');
    const zipPath = path.join(projectRoot, '..', `${backupName}.zip`);
    execSync(`cd "${path.dirname(backupDir)}" && zip -r "${zipPath}" "${path.basename(backupDir)}"`);
    
    console.log(`✅ Full backup created and zipped at: ${zipPath}`);
    
    // Clean up the unzipped backup directory
    console.log('Cleaning up temporary backup directory...');
    execSync(`rm -rf "${backupDir}"`);
    
    return zipPath;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

// Run the backup
try {
  const zipPath = createFullBackup();
  console.log(`\nBackup completed successfully!\nYour backup is available at: ${zipPath}`);
} catch (error) {
  console.error('\nBackup failed:', error);
}
