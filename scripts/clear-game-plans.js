const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function clearGamePlans() {
  console.log('Creating database backup before clearing game plans...');
  
  // Path to the SQLite database
  const dbPath = path.resolve(__dirname, '../prisma/golden_rules.db');
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  
  // Create a backup of the database
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Created backup at: ${backupPath}`);
  
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Count game plans before deletion
    const countBefore = await prisma.gamePlan.count();
    console.log(`Found ${countBefore} game plans in the database.`);
    
    if (countBefore === 0) {
      console.log('No game plans to delete. Table is already empty.');
      return;
    }
    
    // Delete all game plans
    const deleteResult = await prisma.gamePlan.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} game plans from the database.`);
    
    // Verify deletion
    const countAfter = await prisma.gamePlan.count();
    console.log(`Game plans table now has ${countAfter} records.`);
    
  } catch (error) {
    console.error('Error clearing game plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearGamePlans()
  .then(() => console.log('Script completed successfully.'))
  .catch(console.error);
