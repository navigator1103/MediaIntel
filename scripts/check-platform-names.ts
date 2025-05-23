import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlatformNames() {
  try {
    console.log('Checking platform names in the database...');
    
    // Check platform names in rules
    const rulesPlatforms = await prisma.rule.findMany({
      select: {
        platform: true
      },
      distinct: ['platform']
    });
    
    console.log('\nPlatform names in Rules table:');
    console.table(rulesPlatforms);
    
    // Check platform names in scores
    const scoresPlatforms = await prisma.score.findMany({
      select: {
        platform: true
      },
      distinct: ['platform']
    });
    
    console.log('\nPlatform names in Scores table:');
    console.table(scoresPlatforms);
    
    // Check if there are any scores with TikTok platform but showing Google DV360 rules
    const mixedPlatformScores = await prisma.score.findMany({
      where: {
        platform: 'TikTok'
      },
      include: {
        rule: true
      },
      take: 5
    });
    
    console.log('\nSample TikTok scores with their associated rules:');
    for (const score of mixedPlatformScores) {
      console.log(`Score ID: ${score.id}, Platform: ${score.platform}, Rule ID: ${score.ruleId}, Rule Platform: ${score.rule.platform}`);
    }
    
  } catch (error) {
    console.error('Error checking platform names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkPlatformNames()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
