import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDateFormats() {
  try {
    console.log('Starting to fix date formats in GamePlan table...');
    
    // First, find all game plans with potential date format issues
    const gamePlans = await prisma.gamePlan.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true
      }
    });

    console.log(`Found ${gamePlans.length} game plans to check...`);
    
    let updatedCount = 0;
    
    for (const plan of gamePlans) {
      let needsUpdate = false;
      const updateData: { startDate?: Date, endDate?: Date } = {};
      
      // Check and fix startDate
      if (plan.startDate) {
        let newStartDate: Date | null = null;
        
        // If startDate is a string that's a number, it's likely a timestamp
        if (typeof plan.startDate === 'string' && /^\d+$/.test(plan.startDate)) {
          const timestamp = parseInt(plan.startDate, 10);
          // Convert to milliseconds if it's in seconds (10 digits)
          const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
          newStartDate = new Date(timestampMs);
        } 
        // If it's already a Date but invalid, try to parse it
        else if (plan.startDate instanceof Date && isNaN(plan.startDate.getTime())) {
          const timestamp = Date.parse(plan.startDate.toString());
          if (!isNaN(timestamp)) {
            newStartDate = new Date(timestamp);
          }
        }
        
        if (newStartDate && !isNaN(newStartDate.getTime())) {
          updateData.startDate = newStartDate;
          needsUpdate = true;
        }
      }
      
      // Check and fix endDate
      if (plan.endDate) {
        let newEndDate: Date | null = null;
        
        // If endDate is a string that's a number, it's likely a timestamp
        if (typeof plan.endDate === 'string' && /^\d+$/.test(plan.endDate)) {
          const timestamp = parseInt(plan.endDate, 10);
          // Convert to milliseconds if it's in seconds (10 digits)
          const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
          newEndDate = new Date(timestampMs);
        } 
        // If it's already a Date but invalid, try to parse it
        else if (plan.endDate instanceof Date && isNaN(plan.endDate.getTime())) {
          const timestamp = Date.parse(plan.endDate.toString());
          if (!isNaN(timestamp)) {
            newEndDate = new Date(timestamp);
          }
        }
        
        if (newEndDate && !isNaN(newEndDate.getTime())) {
          updateData.endDate = newEndDate;
          needsUpdate = true;
        }
      }
      
      // Update the record if needed
      if (needsUpdate) {
        await prisma.gamePlan.update({
          where: { id: plan.id },
          data: updateData
        });
        updatedCount++;
        console.log(`Updated GamePlan ${plan.id}:`, updateData);
      }
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} game plans with fixed date formats.`);
    
  } catch (error) {
    console.error('Error fixing date formats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixDateFormats()
  .catch((e) => {
    console.error('Script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
