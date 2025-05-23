import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRuleNumbers() {
  try {
    console.log('Checking rule numbers...');
    
    // Get all rules
    const rules = await prisma.rule.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('Current rules:');
    rules.forEach(rule => {
      console.log(`ID: ${rule.id}, Platform: ${rule.platform}, Title: ${rule.title.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('Error checking rule numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkRuleNumbers()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
