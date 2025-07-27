import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function importGamePlansBackup() {
  try {
    // Read the backup file
    const backupFile = '/Users/naveedshah/Documents/Python/MIQ_Current/backups/game-plans/game-plans-backup-Australia-ABP2025-2025-07-20T12-55-05-079Z.json'
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
    
    console.log(`Importing ${backupData.recordCount} game plans from ${backupData.countryName} - ${backupData.lastUpdateName}`)
    
    // Clear existing game plans first
    await prisma.gamePlan.deleteMany({})
    console.log('Cleared existing game plans')
    
    // Import game plans from backup
    for (const gamePlan of backupData.gamePlans) {
      await prisma.gamePlan.create({
        data: {
          campaignId: gamePlan.campaignId,
          mediaSubTypeId: gamePlan.mediaSubTypeId,
          pmTypeId: gamePlan.pmTypeId,
          campaignArchetypeId: gamePlan.campaignArchetypeId,
          burst: gamePlan.burst,
          startDate: gamePlan.startDate,
          endDate: gamePlan.endDate,
          totalBudget: gamePlan.totalBudget,
          janBudget: gamePlan.janBudget,
          febBudget: gamePlan.febBudget,
          marBudget: gamePlan.marBudget,
          aprBudget: gamePlan.aprBudget,
          mayBudget: gamePlan.mayBudget,
          junBudget: gamePlan.junBudget,
          julBudget: gamePlan.julBudget,
          augBudget: gamePlan.augBudget,
          sepBudget: gamePlan.sepBudget,
          octBudget: gamePlan.octBudget,
          novBudget: gamePlan.novBudget,
          decBudget: gamePlan.decBudget,
          totalTrps: gamePlan.totalTrps,
          totalR1Plus: gamePlan.totalR1Plus,
          totalR3Plus: gamePlan.totalR3Plus,
          totalWoa: gamePlan.totalWoa,
          totalWoff: gamePlan.totalWoff,
          totalWeeks: gamePlan.totalWeeks,
          weeksOffAir: gamePlan.weeksOffAir,
          nsVsWm: gamePlan.nsVsWm,
          year: gamePlan.year,
          countryId: gamePlan.countryId,
          business_unit_id: gamePlan.business_unit_id,
          region_id: gamePlan.region_id,
          sub_region_id: gamePlan.sub_region_id,
          category_id: gamePlan.category_id,
          range_id: gamePlan.range_id,
          last_update_id: gamePlan.last_update_id,
          playbook_id: gamePlan.playbook_id,
          weeksLive: gamePlan.weeksLive
        }
      })
    }
    
    console.log(`Successfully imported ${backupData.gamePlans.length} game plans`)
    
    // Verify import
    const count = await prisma.gamePlan.count()
    console.log(`Total game plans in database: ${count}`)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error importing game plans:', error)
    await prisma.$disconnect()
  }
}

importGamePlansBackup()