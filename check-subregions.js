const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all sub-regions from the database
    const dbSubRegions = await prisma.subRegion.findMany();
    console.log('Sub-regions in database:');
    console.log(JSON.stringify(dbSubRegions, null, 2));
    
    // Read the master data JSON file
    const masterDataPath = path.join(__dirname, 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
    
    console.log('\nSub-regions in master data:');
    console.log(JSON.stringify(masterData.subRegions || [], null, 2));
    
    // Find sub-regions in DB but not in master data
    const masterDataSubRegionNames = (masterData.subRegions || []).map(sr => 
      typeof sr === 'string' ? sr.toLowerCase() : (sr.name ? sr.name.toLowerCase() : '')
    );
    
    const missingSubRegions = dbSubRegions.filter(dbSr => 
      !masterDataSubRegionNames.includes(dbSr.name.toLowerCase())
    );
    
    console.log('\nSub-regions in DB but missing from master data:');
    console.log(JSON.stringify(missingSubRegions, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
