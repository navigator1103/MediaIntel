import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function restoreCampaigns() {
  try {
    console.log('Restoring campaigns from backup...');
    
    // Read campaigns from the extracted file
    const campaignsText = fs.readFileSync('/tmp/backup_campaigns.txt', 'utf-8');
    const campaignNames = campaignsText.split('\n').filter(name => name.trim().length > 0);
    
    console.log(`Found ${campaignNames.length} campaigns to restore`);
    
    for (const campaignName of campaignNames) {
      const cleanName = campaignName.trim();
      if (!cleanName) continue;
      
      await prisma.campaign.upsert({
        where: { name: cleanName },
        update: {
          status: 'active',
          updatedAt: new Date().toISOString()
        },
        create: {
          name: cleanName,
          status: 'active',
          createdBy: 'backup_restore',
          notes: 'Restored from backup on ' + new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
      
      console.log(`Restored campaign: ${cleanName}`);
    }
    
    console.log('Campaigns restoration completed!');
    
  } catch (error) {
    console.error('Error restoring campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreCampaigns();