/**
 * Daily Database Backup Scheduler
 * Runs automatic backups and manages scheduling state
 */

import { createDatabaseBackup } from '../backup/backupDatabase';
import fs from 'fs';
import path from 'path';

const SCHEDULER_STATE_FILE = path.join(process.cwd(), 'data', 'scheduler-state.json');
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface SchedulerState {
  lastBackupTime: string;
  lastBackupResult: 'success' | 'failed' | null;
  nextScheduledTime: string;
  isEnabled: boolean;
  totalBackups: number;
}

export class BackupScheduler {
  private static instance: BackupScheduler | null = null;
  private timer: NodeJS.Timeout | null = null;
  private state: SchedulerState;

  private constructor() {
    this.state = this.loadState();
    this.startScheduler();
  }

  public static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  private loadState(): SchedulerState {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(SCHEDULER_STATE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(SCHEDULER_STATE_FILE)) {
        const data = fs.readFileSync(SCHEDULER_STATE_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading scheduler state:', error);
    }

    // Default state
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM tomorrow

    return {
      lastBackupTime: '',
      lastBackupResult: null,
      nextScheduledTime: tomorrow.toISOString(),
      isEnabled: true,
      totalBackups: 0
    };
  }

  private saveState(): void {
    try {
      fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving scheduler state:', error);
    }
  }

  private calculateNextBackupTime(): Date {
    const now = new Date();
    const nextBackup = new Date(now);
    
    // Set to 2 AM tomorrow
    nextBackup.setDate(nextBackup.getDate() + 1);
    nextBackup.setHours(2, 0, 0, 0);
    
    return nextBackup;
  }

  public async performBackup(): Promise<{ success: boolean; error?: string; fileName?: string }> {
    try {
      console.log('🔄 Starting scheduled database backup...');
      
      const result = await createDatabaseBackup();
      
      if (result.success) {
        this.state.lastBackupTime = new Date().toISOString();
        this.state.lastBackupResult = 'success';
        this.state.totalBackups += 1;
        this.state.nextScheduledTime = this.calculateNextBackupTime().toISOString();
        
        console.log('✅ Scheduled backup completed successfully');
        this.saveState();
        
        return { 
          success: true, 
          fileName: result.filePath ? path.basename(result.filePath) : undefined 
        };
      } else {
        this.state.lastBackupResult = 'failed';
        this.state.nextScheduledTime = this.calculateNextBackupTime().toISOString();
        
        console.error('❌ Scheduled backup failed:', result.error);
        this.saveState();
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.state.lastBackupResult = 'failed';
      this.state.nextScheduledTime = this.calculateNextBackupTime().toISOString();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('💥 Backup scheduler error:', errorMessage);
      this.saveState();
      
      return { success: false, error: errorMessage };
    }
  }

  private startScheduler(): void {
    if (!this.state.isEnabled) {
      console.log('📅 Backup scheduler is disabled');
      return;
    }

    this.scheduleNextBackup();
  }

  private scheduleNextBackup(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const now = new Date();
    const nextBackupTime = new Date(this.state.nextScheduledTime);
    const timeUntilBackup = nextBackupTime.getTime() - now.getTime();

    if (timeUntilBackup <= 0) {
      // Should run backup now
      this.performBackup().then(() => {
        this.scheduleNextBackup(); // Schedule the next one
      });
    } else {
      // Schedule for the future
      console.log(`📅 Next database backup scheduled for: ${nextBackupTime.toLocaleString()}`);
      
      this.timer = setTimeout(() => {
        this.performBackup().then(() => {
          this.scheduleNextBackup(); // Schedule the next one
        });
      }, timeUntilBackup);
    }
  }

  public getStatus(): SchedulerState & { 
    timeUntilNextBackup: number;
    nextBackupFormatted: string;
    lastBackupFormatted: string;
  } {
    const now = new Date();
    const nextBackupTime = new Date(this.state.nextScheduledTime);
    const timeUntilNextBackup = Math.max(0, nextBackupTime.getTime() - now.getTime());
    
    return {
      ...this.state,
      timeUntilNextBackup,
      nextBackupFormatted: nextBackupTime.toLocaleString(),
      lastBackupFormatted: this.state.lastBackupTime ? 
        new Date(this.state.lastBackupTime).toLocaleString() : 'Never'
    };
  }

  public enableScheduler(): void {
    this.state.isEnabled = true;
    this.saveState();
    this.startScheduler();
    console.log('✅ Backup scheduler enabled');
  }

  public disableScheduler(): void {
    this.state.isEnabled = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.saveState();
    console.log('⏸️ Backup scheduler disabled');
  }

  public async triggerManualBackup(): Promise<{ success: boolean; error?: string; fileName?: string }> {
    console.log('🔄 Manual backup triggered via scheduler...');
    return await this.performBackup();
  }
}

// Initialize the scheduler when this module is imported
export const initializeBackupScheduler = () => {
  const scheduler = BackupScheduler.getInstance();
  console.log('🚀 Database backup scheduler initialized');
  console.log('📊 Scheduler status:', scheduler.getStatus());
  return scheduler;
};