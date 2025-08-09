import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting production data migration...\n');
  
  // Open production database
  const prodDb = new Database('/Users/naveedshah/Downloads/golden_rules_backup_2025-08-09.db');
  
  try {
    // 1. Migrate Users (excluding existing ones)
    console.log('📤 Migrating users...');
    const prodUsers = prodDb.prepare(`
      SELECT * FROM users 
      WHERE email NOT IN ('admin@example.com', 'user@example.com')
    `).all() as any[];
    
    let usersAdded = 0;
    for (const user of prodUsers) {
      try {
        // Check if user already exists
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
              accessibleCountries: user.accessible_countries || user.accessibleCountries,
              accessibleBrands: user.accessible_brands || user.accessibleBrands,
              accessiblePages: user.accessible_pages || user.accessiblePages,
              canAccessUserDashboard: user.can_access_user_dashboard ?? true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          usersAdded++;
          console.log(`  ✅ Added user: ${user.email}`);
        }
      } catch (error: any) {
        console.log(`  ⚠️ Skipping user ${user.email}: ${error.message}`);
      }
    }
    console.log(`  ✅ Total: Added ${usersAdded} new users\n`);
    
    // 2. Migrate Game Plans
    console.log('📤 Migrating game plans...');
    const prodGamePlans = prodDb.prepare('SELECT * FROM game_plans').all() as any[];
    
    // Get existing game plan IDs to avoid duplicates
    const existingGamePlans = await prisma.gamePlan.findMany({
      select: { id: true }
    });
    const existingIds = new Set(existingGamePlans.map(gp => gp.id));
    
    let gamePlansAdded = 0;
    let gamePlansSkipped = 0;
    
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
                janBudget: gp.jan_budget || 0,
                febBudget: gp.feb_budget || 0,
                marBudget: gp.mar_budget || 0,
                aprBudget: gp.apr_budget || 0,
                mayBudget: gp.may_budget || 0,
                junBudget: gp.jun_budget || 0,
                julBudget: gp.jul_budget || 0,
                augBudget: gp.aug_budget || 0,
                sepBudget: gp.sep_budget || 0,
                octBudget: gp.oct_budget || 0,
                novBudget: gp.nov_budget || 0,
                decBudget: gp.dec_budget || 0,
                totalWoa: gp.total_woa || 0,
                totalWoff: gp.total_woff || 0,
                totalWeeks: gp.total_weeks || 0,
                year: gp.year,
                last_update_id: gp.last_update_id
              }
            });
            gamePlansAdded++;
            console.log(`  ✅ Added game plan ${gp.id} for campaign ${campaign.name}`);
          } else {
            console.log(`  ⚠️ Skipping game plan ${gp.id}: Campaign ${gp.campaign_id} not found`);
            gamePlansSkipped++;
          }
        }
      } catch (error: any) {
        console.log(`  ⚠️ Error adding game plan ${gp.id}: ${error.message}`);
        gamePlansSkipped++;
      }
    }
    console.log(`  ✅ Total: Added ${gamePlansAdded} new game plans, skipped ${gamePlansSkipped}\n`);
    
    // 3. Check for any missing campaigns
    console.log('📤 Checking for missing campaigns...');
    const prodCampaigns = prodDb.prepare('SELECT * FROM campaigns').all() as any[];
    const existingCampaigns = await prisma.campaign.findMany({
      select: { id: true }
    });
    const existingCampaignIds = new Set(existingCampaigns.map(c => c.id));
    
    let campaignsAdded = 0;
    for (const campaign of prodCampaigns) {
      if (!existingCampaignIds.has(campaign.id)) {
        try {
          await prisma.campaign.create({
            data: {
              id: campaign.id,
              name: campaign.name,
              rangeId: campaign.range_id
            }
          });
          campaignsAdded++;
          console.log(`  ✅ Added campaign: ${campaign.name}`);
        } catch (error: any) {
          console.log(`  ⚠️ Error adding campaign ${campaign.name}: ${error.message}`);
        }
      }
    }
    console.log(`  ✅ Total: Added ${campaignsAdded} new campaigns\n`);
    
    // Final counts
    const totalUsers = await prisma.user.count();
    const totalGamePlans = await prisma.gamePlan.count();
    const totalCampaigns = await prisma.campaign.count();
    
    console.log('✨ Migration completed!');
    console.log(`📊 Final database counts:`);
    console.log(`   - Users: ${totalUsers}`);
    console.log(`   - Game Plans: ${totalGamePlans}`);
    console.log(`   - Campaigns: ${totalCampaigns}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    prodDb.close();
    await prisma.$disconnect();
  }
}

migrateData().catch(console.error);