import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScores() {
  try {
    console.log('Checking scores in the database...');
    
    // Get all scores with their rules
    const scores = await prisma.score.findMany({
      include: {
        rule: true,
        country: true,
        brand: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`Found ${scores.length} scores in total`);
    console.log('-----------------------------------');
    
    // Check for platform inconsistencies
    const platformIssues = scores.filter(score => score.platform !== score.rule.platform);
    
    if (platformIssues.length > 0) {
      console.log(`\nFound ${platformIssues.length} scores with platform inconsistencies:`);
      platformIssues.forEach(score => {
        console.log(`Score ID: ${score.id}, Score Platform: ${score.platform}, Rule Platform: ${score.rule.platform}, Rule ID: ${score.ruleId}`);
      });
      
      // Fix platform inconsistencies
      console.log('\nFixing platform inconsistencies...');
      for (const score of platformIssues) {
        await prisma.score.update({
          where: { id: score.id },
          data: { platform: score.rule.platform }
        });
        console.log(`Updated Score ID: ${score.id} platform from "${score.platform}" to "${score.rule.platform}"`);
      }
    } else {
      console.log('No platform inconsistencies found.');
    }
    
    // Show sample scores
    console.log('\nSample scores:');
    scores.slice(0, 5).forEach(score => {
      console.log(`Score ID: ${score.id}, Rule ID: ${score.ruleId}, Platform: ${score.platform}, Rule Platform: ${score.rule.platform}, Country: ${score.country.name}, Brand: ${score.brand.name}`);
    });
    
  } catch (error) {
    console.error('Error checking scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkScores()
  .then(() => console.log('\nScript completed'))
  .catch(e => console.error('Script failed:', e));
