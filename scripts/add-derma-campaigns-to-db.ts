import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// New derma campaigns to add
const newDermaCampaigns = [
  'Dermo Purifyer',
  'Anti-Acne Range',
  'Dermopure Body (Bacne)',
  'Eucerin DermoPure',
  'Acne Guard',
  'Anti Age Serum',
  'Hyaluron Filler Range',
  'Age Defense Cream',
  'Cellular Anti Age',
  'Collagen Plus',
  'Anti Pigment Serum',
  'Thiamidol Range',
  'Dark Spot Corrector',
  'Brightening Complex',
  'Pigment Control',
  'Aquaphor Range',
  'pH5 Gentle',
  'Atopi Control',
  'Ultra Hydrating',
  'Dry Skin Relief',
  'Moisture Barrier'
];

async function addDermaCampaignsToDatabase() {
  try {
    console.log('🔄 Adding derma campaigns to database...');

    let campaignsAdded = 0;

    for (const campaignName of newDermaCampaigns) {
      try {
        // Check if campaign already exists
        const existing = await prisma.campaign.findUnique({
          where: { name: campaignName }
        });

        if (!existing) {
          await prisma.campaign.create({
            data: { name: campaignName }
          });
          campaignsAdded++;
          console.log(`✅ Added campaign: ${campaignName}`);
        } else {
          console.log(`ℹ️  Campaign already exists: ${campaignName}`);
        }
      } catch (error: any) {
        console.log(`⚠️  Error adding campaign ${campaignName}: ${error.message}`);
      }
    }

    console.log(`✅ Added ${campaignsAdded} new derma campaigns to database`);
    
    // Verify total campaigns in database
    const totalCampaigns = await prisma.campaign.count();
    console.log(`📊 Total campaigns in database: ${totalCampaigns}`);

    // Show derma campaigns in database
    const dermaCampaignsInDb = await prisma.campaign.findMany({
      where: {
        name: {
          in: newDermaCampaigns
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 Derma campaigns in database:');
    dermaCampaignsInDb.forEach(campaign => {
      console.log(`- ${campaign.name} (ID: ${campaign.id})`);
    });

  } catch (error) {
    console.error('❌ Error adding derma campaigns to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDermaCampaignsToDatabase();