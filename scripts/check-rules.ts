import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRules() {
  try {
    console.log('Checking all rules in the database...');
    
    const rules = await prisma.rule.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`Found ${rules.length} rules in total`);
    console.log('-----------------------------------');
    
    // Group rules by platform
    const platformGroups = rules.reduce((acc, rule) => {
      if (!acc[rule.platform]) {
        acc[rule.platform] = [];
      }
      acc[rule.platform].push(rule);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Display rules by platform
    for (const [platform, platformRules] of Object.entries(platformGroups)) {
      console.log(`\nPlatform: ${platform} (${platformRules.length} rules)`);
      console.log('-----------------------------------');
      
      platformRules.forEach(rule => {
        console.log(`ID: ${rule.id}, Category: ${rule.category}, Title: ${rule.title.substring(0, 40)}...`);
      });
    }
    
  } catch (error) {
    console.error('Error checking rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkRules()
  .then(() => console.log('\nScript completed'))
  .catch(e => console.error('Script failed:', e));
