import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const prisma = new PrismaClient();

async function restoreGamePlans() {
  try {
    // Open the backup database
    const backupDb = await open({
      filename: '/Users/naveedshah/Documents/Python/MIQ_Current/backups/20250623_015849_deployment_backup/database/golden_rules_main.db',
      driver: sqlite3.Database
    });

    // Get all game plans from backup
    const gamePlans = await backupDb.all(`
      SELECT 
        campaign_id,
        media_sub_type_id,
        pm_type_id,
        start_date,
        end_date,
        total_budget,
        q1_budget,
        q2_budget,
        q3_budget,
        q4_budget,
        trps,
        reach_1_plus,
        reach_3_plus,
        created_at,
        updated_at,
        year,
        country_id,
        business_unit_id,
        region_id,
        sub_region_id,
        category_id,
        range_id,
        last_update_id,
        playbook_id
      FROM game_plans
    `);

    console.log(`Found ${gamePlans.length} game plans in backup`);

    // Check current game plans count
    const currentCount = await prisma.gamePlan.count();
    console.log(`Current game plans count: ${currentCount}`);

    if (currentCount > 0) {
      console.log('WARNING: There are existing game plans. Do you want to continue? (This will not delete existing data)');
      // For safety, we'll just add the missing ones
    }

    // Restore each game plan
    let restored = 0;
    for (const plan of gamePlans) {
      try {
        // Check if this game plan already exists (by matching key fields)
        const existing = await prisma.gamePlan.findFirst({
          where: {
            campaignId: plan.campaign_id,
            mediaSubTypeId: plan.media_sub_type_id,
            startDate: plan.start_date,
            endDate: plan.end_date
          }
        });

        if (!existing) {
          await prisma.gamePlan.create({
            data: {
              campaignId: plan.campaign_id,
              mediaSubTypeId: plan.media_sub_type_id,
              pmTypeId: plan.pm_type_id,
              burst: 1, // Default value for new column
              startDate: plan.start_date,
              endDate: plan.end_date,
              totalBudget: plan.total_budget || 0,
              q1Budget: plan.q1_budget,
              q2Budget: plan.q2_budget,
              q3Budget: plan.q3_budget,
              q4Budget: plan.q4_budget,
              trps: plan.trps,
              reach1Plus: plan.reach_1_plus,
              reach3Plus: plan.reach_3_plus,
              totalWoa: null, // New column, not in backup
              weeksOffAir: null, // New column, not in backup
              year: plan.year,
              countryId: plan.country_id,
              business_unit_id: plan.business_unit_id,
              region_id: plan.region_id,
              sub_region_id: plan.sub_region_id,
              category_id: plan.category_id,
              range_id: plan.range_id,
              last_update_id: plan.last_update_id,
              playbook_id: plan.playbook_id,
              createdAt: plan.created_at || new Date().toISOString(),
              updatedAt: plan.updated_at || new Date().toISOString()
            }
          });
          restored++;
          console.log(`Restored game plan ${restored}/${gamePlans.length}`);
        } else {
          console.log(`Skipping existing game plan for campaign ${plan.campaign_id}, media subtype ${plan.media_sub_type_id}`);
        }
      } catch (error) {
        console.error(`Error restoring game plan:`, error);
        console.error('Plan data:', plan);
      }
    }

    console.log(`\nRestoration complete!`);
    console.log(`Restored ${restored} game plans`);
    
    // Verify final count
    const finalCount = await prisma.gamePlan.count();
    console.log(`Final game plans count: ${finalCount}`);

    await backupDb.close();
  } catch (error) {
    console.error('Error during restoration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreGamePlans();