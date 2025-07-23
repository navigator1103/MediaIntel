import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface GamePlanBackup {
  timestamp: string;
  countryId: number;
  countryName: string;
  lastUpdateId: number;
  lastUpdateName: string;
  recordCount: number;
  backupFile: string;
  gamePlans: any[];
}

export async function createGamePlanBackup(
  countryId: number, 
  lastUpdateId: number,
  reason: string = 'import'
): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', 'game-plans');
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get country and lastUpdate info for the filename
    const [country, lastUpdate] = await Promise.all([
      prisma.country.findUnique({ where: { id: countryId } }),
      prisma.lastUpdate.findUnique({ where: { id: lastUpdateId } })
    ]);

    if (!country || !lastUpdate) {
      throw new Error(`Country (ID: ${countryId}) or LastUpdate (ID: ${lastUpdateId}) not found`);
    }

    // Get all game plans for this country and lastUpdate
    const gamePlans = await prisma.gamePlan.findMany({
      where: {
        countryId: countryId,
        last_update_id: lastUpdateId
      },
      include: {
        campaign: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        pmType: true,
        country: true,
        lastUpdate: true,
        category: true
      }
    });

    const backup: GamePlanBackup = {
      timestamp,
      countryId,
      countryName: country.name,
      lastUpdateId,
      lastUpdateName: lastUpdate.name,
      recordCount: gamePlans.length,
      backupFile: '',
      gamePlans
    };

    const fileName = `game-plans-backup-${country.name.replace(/[^a-zA-Z0-9]/g, '')}-${lastUpdate.name.replace(/[^a-zA-Z0-9]/g, '')}-${timestamp}.json`;
    const backupFile = path.join(backupDir, fileName);
    
    backup.backupFile = fileName;

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log(`✅ Game plans backup created: ${fileName}`);
    console.log(`   - Country: ${country.name} (ID: ${countryId})`);
    console.log(`   - LastUpdate: ${lastUpdate.name} (ID: ${lastUpdateId})`);
    console.log(`   - Records backed up: ${gamePlans.length}`);
    console.log(`   - Reason: ${reason}`);

    return backupFile;
  } catch (error) {
    console.error('❌ Error creating game plan backup:', error);
    throw error;
  }
}

export async function restoreGamePlanBackup(backupFile: string): Promise<number> {
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const backupData: GamePlanBackup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📥 Restoring game plans from backup: ${backupData.backupFile}`);
    console.log(`   - Country: ${backupData.countryName} (ID: ${backupData.countryId})`);
    console.log(`   - LastUpdate: ${backupData.lastUpdateName} (ID: ${backupData.lastUpdateId})`);
    console.log(`   - Records to restore: ${backupData.recordCount}`);

    let restoredCount = 0;

    for (const gamePlan of backupData.gamePlans) {
      try {
        await prisma.gamePlan.create({
          data: {
            campaignId: gamePlan.campaignId,
            mediaSubTypeId: gamePlan.mediaSubTypeId,
            pmTypeId: gamePlan.pmTypeId,
            burst: gamePlan.burst || 1,
            startDate: gamePlan.startDate,
            endDate: gamePlan.endDate,
            totalBudget: gamePlan.totalBudget,
            q1Budget: gamePlan.q1Budget,
            q2Budget: gamePlan.q2Budget,
            q3Budget: gamePlan.q3Budget,
            q4Budget: gamePlan.q4Budget,
            trps: gamePlan.trps,
            reach1Plus: gamePlan.reach1Plus,
            reach3Plus: gamePlan.reach3Plus,
            totalWoa: gamePlan.totalWoa,
            weeksOffAir: gamePlan.weeksOffAir,
            year: gamePlan.year,
            countryId: gamePlan.countryId,
            business_unit_id: gamePlan.business_unit_id,
            region_id: gamePlan.region_id,
            sub_region_id: gamePlan.sub_region_id,
            category_id: gamePlan.category_id,
            range_id: gamePlan.range_id,
            last_update_id: gamePlan.last_update_id,
            playbook_id: gamePlan.playbook_id
          }
        });
        restoredCount++;
      } catch (error) {
        console.error(`Error restoring game plan ${gamePlan.id}:`, error);
      }
    }

    console.log(`✅ Restored ${restoredCount} game plans from backup`);
    return restoredCount;
  } catch (error) {
    console.error('❌ Error restoring game plan backup:', error);
    throw error;
  }
}

export async function listGamePlanBackups(): Promise<string[]> {
  const backupDir = path.join(process.cwd(), 'backups', 'game-plans');
  
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  return fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a)); // Sort by date descending
}