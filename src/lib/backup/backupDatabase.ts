/**
 * Database Backup Utility
 * Creates daily backups of the SQLite database
 * Maintains backup history with configurable retention
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'golden_rules.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 30; // Keep 30 days of backups

export async function createDatabaseBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
      return { success: false, error: 'Database file not found' };
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const backupFileName = `golden_rules_backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);

    console.log(`✅ Database backup created: ${backupFileName}`);
    
    // Cleanup old backups
    await cleanupOldBackups();

    return { success: true, filePath: backupPath };
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function cleanupOldBackups(): Promise<void> {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('golden_rules_backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime()); // Sort by modification time, newest first

    // Keep only the most recent MAX_BACKUPS files
    const filesToDelete = files.slice(MAX_BACKUPS);
    
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    }

    if (filesToDelete.length > 0) {
      console.log(`✅ Cleanup complete: Kept ${Math.min(files.length, MAX_BACKUPS)} backups, deleted ${filesToDelete.length} old backups`);
    }
  } catch (error) {
    console.error('⚠️  Cleanup failed:', error);
  }
}

export async function listBackups(): Promise<Array<{ name: string; size: number; date: Date; path: string }>> {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('golden_rules_backup_') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          date: stats.mtime,
          path: filePath
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first

    return files;
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
}

