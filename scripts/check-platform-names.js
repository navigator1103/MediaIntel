const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlatformNames() {
  try {
    console.log('Checking platform names in the database...');
    
    // Get distinct platform names from rules table
    const rulePlatforms = await prisma.$queryRaw`SELECT DISTINCT platform FROM rules`;
    console.log('Platform names in rules table:');
    rulePlatforms.forEach(p => console.log(`- "${p.platform}"`));
    
    // Get distinct platform names from scores table
    const scorePlatforms = await prisma.$queryRaw`SELECT DISTINCT platform FROM scores`;
    console.log('\nPlatform names in scores table:');
    scorePlatforms.forEach(p => console.log(`- "${p.platform}"`));
    
    // Check if there are any scores for Google DV360
    const dv360Scores = await prisma.score.count({
      where: {
        platform: 'Google DV360'
      }
    });
    console.log(`\nNumber of scores with platform="Google DV360": ${dv360Scores}`);
    
    // Check if there are any scores for just DV360
    const justDv360Scores = await prisma.score.count({
      where: {
        platform: 'DV360'
      }
    });
    console.log(`Number of scores with platform="DV360": ${justDv360Scores}`);
    
    // Check if there are any rules for Google DV360
    const dv360Rules = await prisma.rule.count({
      where: {
        platform: 'Google DV360'
      }
    });
    console.log(`\nNumber of rules with platform="Google DV360": ${dv360Rules}`);
    
    // Check if there are any rules for just DV360
    const justDv360Rules = await prisma.rule.count({
      where: {
        platform: 'DV360'
      }
    });
    console.log(`Number of rules with platform="DV360": ${justDv360Rules}`);
    
    // Check the rule-score relationship for Google DV360
    if (dv360Rules > 0) {
      const sampleRule = await prisma.rule.findFirst({
        where: {
          platform: 'Google DV360'
        },
        include: {
          scores: {
            take: 1
          }
        }
      });
      
      if (sampleRule && sampleRule.scores.length > 0) {
        console.log('\nSample Google DV360 rule and its score:');
        console.log(`Rule ID: ${sampleRule.id}, Platform: "${sampleRule.platform}", Title: "${sampleRule.title}"`);
        console.log(`Score ID: ${sampleRule.scores[0].id}, Platform: "${sampleRule.scores[0].platform}"`);
      }
    }
    
  } catch (error) {
    console.error('Error checking platform names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlatformNames()
  .then(() => console.log('Done checking platform names.'))
  .catch(e => console.error(e));
