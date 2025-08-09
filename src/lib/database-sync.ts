import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface SyncConfig {
  enabled: boolean;
  mode: 'manual' | 'scheduled';
  direction: 'production-to-local'; // ONE-WAY ONLY - Never sync local to production
  schedule?: string; // cron format
  productionSource: 'gcs' | 'local'; // Google Cloud Storage or local file
  gcsPath?: string;
  localPath?: string;
  tables: string[];
  excludeTables?: string[];
  preserveLocalData?: boolean; // Keep local-only records (like demo accounts)
  safeMode?: boolean; // Extra confirmation for destructive operations
}

interface SyncResult {
  success: boolean;
  timestamp: string;
  tablesSync: {
    [tableName: string]: {
      added: number;
      updated: number;
      skipped: number;
      errors: number;
    };
  };
  totalRecords: number;
  duration: number;
  errors: string[];
}

class DatabaseSyncService {
  private config: SyncConfig;
  private syncHistory: SyncResult[] = [];
  private isSyncing = false;
  private syncStateFile = path.join(process.cwd(), 'data', 'sync-state.json');

  constructor(config?: Partial<SyncConfig>) {
    this.config = {
      enabled: process.env.DB_SYNC_ENABLED === 'true',
      mode: (process.env.DB_SYNC_MODE as 'manual' | 'scheduled') || 'manual',
      direction: 'production-to-local', // ALWAYS one-way from production to local
      schedule: process.env.DB_SYNC_SCHEDULE || '0 3 * * *', // 3 AM daily
      productionSource: (process.env.DB_SYNC_SOURCE as 'gcs' | 'local') || 'gcs',
      gcsPath: process.env.DB_SYNC_GCS_PATH || 'gs://goldenrulesnextjs-db/golden_rules.db',
      localPath: process.env.DB_SYNC_LOCAL_PATH,
      tables: [
        'users',
        'campaigns',
        'game_plans',
        'media_sufficiency',
        'share_of_voice',
        'tv_diminishing_returns',
        'digital_diminishing_returns',
        'multimedia_diminishing_returns'
      ],
      excludeTables: ['password_reset_tokens', 'sessions'],
      preserveLocalData: true,
      safeMode: true,
      ...config
    };

    this.loadSyncHistory();
  }

  private loadSyncHistory() {
    try {
      if (fs.existsSync(this.syncStateFile)) {
        const data = fs.readFileSync(this.syncStateFile, 'utf-8');
        const state = JSON.parse(data);
        this.syncHistory = state.history || [];
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  }

  private saveSyncHistory() {
    try {
      const dir = path.dirname(this.syncStateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.syncStateFile, JSON.stringify({
        lastSync: this.syncHistory[0],
        history: this.syncHistory.slice(0, 100) // Keep last 100 syncs
      }, null, 2));
    } catch (error) {
      console.error('Failed to save sync history:', error);
    }
  }

  async downloadProductionDatabase(): Promise<string> {
    const tempPath = path.join(process.cwd(), 'data', 'temp', `prod_sync_${Date.now()}.db`);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    if (this.config.productionSource === 'gcs') {
      console.log(`📥 Downloading production database from ${this.config.gcsPath}...`);
      try {
        await execAsync(`gsutil cp ${this.config.gcsPath} ${tempPath}`);
        console.log('✅ Production database downloaded successfully');
      } catch (error) {
        throw new Error(`Failed to download from GCS: ${error}`);
      }
    } else if (this.config.localPath) {
      console.log(`📥 Copying production database from ${this.config.localPath}...`);
      fs.copyFileSync(this.config.localPath, tempPath);
      console.log('✅ Production database copied successfully');
    } else {
      throw new Error('No production database source configured');
    }

    return tempPath;
  }

  async syncTable(tableName: string, prodDb: Database.Database): Promise<any> {
    const result = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    try {
      // Special handling for different tables
      switch (tableName) {
        case 'users':
          return await this.syncUsers(prodDb);
        case 'campaigns':
          return await this.syncCampaigns(prodDb);
        case 'game_plans':
          return await this.syncGamePlans(prodDb);
        case 'media_sufficiency':
          return await this.syncMediaSufficiency(prodDb);
        case 'share_of_voice':
          return await this.syncShareOfVoice(prodDb);
        case 'tv_diminishing_returns':
          return await this.syncTvDiminishingReturns(prodDb);
        case 'digital_diminishing_returns':
          return await this.syncDigitalDiminishingReturns(prodDb);
        default:
          return await this.syncGenericTable(tableName, prodDb);
      }
    } catch (error: any) {
      console.error(`❌ Error syncing ${tableName}:`, error.message);
      result.errors++;
      return result;
    }
  }

  private async syncUsers(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    
    // Get production users (excluding demo accounts)
    const prodUsers = prodDb.prepare(`
      SELECT * FROM users 
      WHERE email NOT IN ('admin@example.com', 'user@example.com')
    `).all() as any[];

    for (const user of prodUsers) {
      try {
        const existing = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              password: user.password,
              name: user.name,
              role: user.role,
              accessibleCountries: user.accessible_countries,
              accessibleBrands: user.accessible_brands,
              accessiblePages: user.accessible_pages,
              canAccessUserDashboard: user.can_access_user_dashboard ?? true
            }
          });
          result.added++;
        } else if (this.config.preserveLocalData) {
          // Update only if production has newer data
          if (user.updated_at && existing.updatedAt) {
            const prodDate = new Date(user.updated_at);
            if (prodDate > existing.updatedAt) {
              await prisma.user.update({
                where: { email: user.email },
                data: {
                  name: user.name,
                  role: user.role,
                  accessibleCountries: user.accessible_countries,
                  accessibleBrands: user.accessible_brands,
                  accessiblePages: user.accessible_pages
                }
              });
              result.updated++;
            } else {
              result.skipped++;
            }
          } else {
            result.skipped++;
          }
        }
      } catch (error: any) {
        console.error(`Error syncing user ${user.email}:`, error.message);
        result.errors++;
      }
    }

    return result;
  }

  private async syncCampaigns(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    
    const prodCampaigns = prodDb.prepare('SELECT * FROM campaigns').all() as any[];
    const existingCampaigns = await prisma.campaign.findMany({
      select: { id: true, name: true }
    });
    const existingIds = new Set(existingCampaigns.map(c => c.id));

    for (const campaign of prodCampaigns) {
      try {
        if (!existingIds.has(campaign.id)) {
          await prisma.campaign.create({
            data: {
              id: campaign.id,
              name: campaign.name,
              rangeId: campaign.range_id,
              status: campaign.status || 'active'
            }
          });
          result.added++;
        } else {
          result.skipped++;
        }
      } catch (error: any) {
        console.error(`Error syncing campaign ${campaign.name}:`, error.message);
        result.errors++;
      }
    }

    return result;
  }

  private async syncGamePlans(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    
    const prodGamePlans = prodDb.prepare('SELECT * FROM game_plans').all() as any[];
    const existingGamePlans = await prisma.gamePlan.findMany({
      select: { id: true }
    });
    const existingIds = new Set(existingGamePlans.map(gp => gp.id));

    for (const gp of prodGamePlans) {
      try {
        if (!existingIds.has(gp.id)) {
          // Check if campaign exists
          const campaign = await prisma.campaign.findUnique({
            where: { id: gp.campaign_id }
          });

          if (campaign) {
            await prisma.gamePlan.create({
              data: {
                id: gp.id,
                campaignId: gp.campaign_id,
                mediaSubTypeId: gp.media_sub_type_id,
                pmTypeId: gp.pm_type_id,
                countryId: gp.country_id,
                business_unit_id: gp.business_unit_id,
                category_id: gp.category_id,
                range_id: gp.range_id,
                burst: gp.burst,
                startDate: gp.start_date || '',
                endDate: gp.end_date || '',
                totalBudget: gp.total_budget || 0,
                janBudget: gp.jan_budget,
                febBudget: gp.feb_budget,
                marBudget: gp.mar_budget,
                aprBudget: gp.apr_budget,
                mayBudget: gp.may_budget,
                junBudget: gp.jun_budget,
                julBudget: gp.jul_budget,
                augBudget: gp.aug_budget,
                sepBudget: gp.sep_budget,
                octBudget: gp.oct_budget,
                novBudget: gp.nov_budget,
                decBudget: gp.dec_budget,
                totalWoa: gp.total_woa,
                totalWoff: gp.total_woff,
                totalWeeks: gp.total_weeks,
                year: gp.year,
                last_update_id: gp.last_update_id
              }
            });
            result.added++;
          } else {
            result.skipped++;
          }
        } else {
          result.skipped++;
        }
      } catch (error: any) {
        console.error(`Error syncing game plan ${gp.id}:`, error.message);
        result.errors++;
      }
    }

    return result;
  }

  private async syncMediaSufficiency(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    // Similar implementation for media sufficiency
    // Add specific sync logic here
    return result;
  }

  private async syncShareOfVoice(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    // Similar implementation for SOV
    // Add specific sync logic here
    return result;
  }

  private async syncTvDiminishingReturns(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    
    const localMaxId = await prisma.tvDiminishingReturns.aggregate({
      _max: { id: true }
    });
    const maxId = localMaxId._max.id || 0;
    
    const newRecords = prodDb.prepare(`
      SELECT * FROM tv_diminishing_returns 
      WHERE id > ?
      ORDER BY id
    `).all(maxId) as any[];

    for (const record of newRecords) {
      try {
        await prisma.tvDiminishingReturns.create({
          data: {
            id: record.id,
            countryId: record.country_id,
            businessUnitId: record.business_unit_id,
            trp: record.trp,
            audience1Reach: record.audience1_reach,
            audience2Reach: record.audience2_reach,
            audience3Reach: record.audience3_reach,
            audience4Reach: record.audience4_reach,
            audience5Reach: record.audience5_reach
          }
        });
        result.added++;
      } catch (error: any) {
        console.error(`Error syncing TV DR ${record.id}:`, error.message);
        result.errors++;
      }
    }

    return result;
  }

  private async syncDigitalDiminishingReturns(prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    // Similar implementation for digital DR
    // Add specific sync logic here
    return result;
  }

  private async syncGenericTable(tableName: string, prodDb: Database.Database) {
    const result = { added: 0, updated: 0, skipped: 0, errors: 0 };
    // Generic sync logic for other tables
    return result;
  }

  async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    // Safety check - ensure this is production-to-local only
    if (this.config.direction !== 'production-to-local') {
      throw new Error('Invalid sync direction. Only production-to-local sync is allowed.');
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const errors: string[] = [];
    const tablesSync: any = {};
    let totalRecords = 0;
    let prodDbPath: string | null = null;
    let prodDb: Database.Database | null = null;

    try {
      console.log('🔄 Starting ONE-WAY database synchronization (Production → Local)...\n');
      
      // Download production database
      prodDbPath = await this.downloadProductionDatabase();
      prodDb = new Database(prodDbPath, { readonly: true });

      // Sync each configured table
      for (const tableName of this.config.tables) {
        if (this.config.excludeTables?.includes(tableName)) {
          continue;
        }

        console.log(`📊 Syncing ${tableName}...`);
        const tableResult = await this.syncTable(tableName, prodDb);
        tablesSync[tableName] = tableResult;
        totalRecords += tableResult.added + tableResult.updated;
        console.log(`   ✅ ${tableName}: +${tableResult.added} added, ${tableResult.updated} updated, ${tableResult.skipped} skipped\n`);
      }

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: true,
        timestamp: new Date().toISOString(),
        tablesSync,
        totalRecords,
        duration,
        errors
      };

      this.syncHistory.unshift(result);
      this.saveSyncHistory();

      console.log('✨ Synchronization completed successfully!');
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)} seconds`);
      console.log(`📈 Total records synced: ${totalRecords}`);

      return result;

    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      errors.push(error.message);
      
      const result: SyncResult = {
        success: false,
        timestamp: new Date().toISOString(),
        tablesSync,
        totalRecords,
        duration: Date.now() - startTime,
        errors
      };

      this.syncHistory.unshift(result);
      this.saveSyncHistory();

      throw error;

    } finally {
      this.isSyncing = false;
      
      // Cleanup
      if (prodDb) {
        prodDb.close();
      }
      if (prodDbPath && fs.existsSync(prodDbPath)) {
        fs.unlinkSync(prodDbPath);
      }
      
      await prisma.$disconnect();
    }
  }

  getLastSyncInfo() {
    return this.syncHistory[0] || null;
  }

  getSyncHistory(limit = 10) {
    return this.syncHistory.slice(0, limit);
  }

  isEnabled() {
    return this.config.enabled;
  }

  isSyncInProgress() {
    return this.isSyncing;
  }
}

// Create singleton instance
let syncService: DatabaseSyncService | null = null;

export function getDatabaseSyncService(config?: Partial<SyncConfig>): DatabaseSyncService {
  if (!syncService) {
    syncService = new DatabaseSyncService(config);
  }
  return syncService;
}

export { DatabaseSyncService, SyncConfig, SyncResult };