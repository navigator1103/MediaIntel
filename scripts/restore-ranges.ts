import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function restoreRanges() {
  try {
    console.log('Restoring ranges from backup...');
    
    // Read ranges from the extracted file
    const rangesText = fs.readFileSync('/tmp/backup_ranges.txt', 'utf-8');
    const rangeNames = rangesText.split('\n').filter(name => name.trim().length > 0);
    
    console.log(`Found ${rangeNames.length} ranges to restore`);
    
    for (const rangeName of rangeNames) {
      const cleanName = rangeName.trim();
      if (!cleanName) continue;
      
      await prisma.range.upsert({
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
      
      console.log(`Restored range: ${cleanName}`);
    }
    
    console.log('Ranges restoration completed!');
    
  } catch (error) {
    console.error('Error restoring ranges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreRanges();