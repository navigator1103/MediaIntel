import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function checkDatabase(dbPath: string, dbName: string) {
  console.log(`\n===== Checking ${dbName} Database =====`);
  console.log(`Database path: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at: ${dbPath}`);
    return;
  }
  
  // Create a new PrismaClient instance that uses the specified SQLite database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`
      }
    }
  });
  
  try {
    
    console.log('SQLite database found. Fetching countries...');
    
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        region: true
      }
    });
    
    console.log(`Found ${countries.length} countries in the SQLite database:`);
    console.log('-------------------------------------------');
    
    countries.forEach((country, index) => {
      console.log(`${index + 1}. ${country.name} (Region: ${country.region.name})`);
    });
    
    console.log('-------------------------------------------');
    console.log('Country names only (for easy copying):');
    console.log(countries.map(c => c.name).join(', '));
    
    // Also check if there's any media sufficiency data
    const campaignMedia = await prisma.campaignMedia.count();
    console.log(`\nMedia Sufficiency Data:`);
    console.log(`Total Campaign Media records: ${campaignMedia}`);
    
    const campaigns = await prisma.campaign.count();
    console.log(`Total Campaign records: ${campaigns}`);
    
  } catch (error) {
    console.error(`Error querying ${dbName} database:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // Check the first database (golden_rules.db)
  const goldenRulesDbPath = path.resolve('./prisma/golden_rules.db');
  await checkDatabase(goldenRulesDbPath, 'Golden Rules');
  
  // Check the second database (dev.db)
  const devDbPath = path.resolve('./prisma/prisma/dev.db');
  await checkDatabase(devDbPath, 'Development');
}

main().catch(error => {
  console.error('Error running database checks:', error);
  process.exit(1);
});
