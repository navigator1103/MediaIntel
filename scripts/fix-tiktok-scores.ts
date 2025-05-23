import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTikTokScores() {
  try {
    console.log('Fixing TikTok scores in the database...');
    
    // Find all scores associated with TikTok rules
    const tikTokScores = await prisma.score.findMany({
      where: {
        rule: {
          platform: 'TikTok'
        }
      },
      include: {
        rule: true
      }
    });
    
    console.log(`Found ${tikTokScores.length} scores associated with TikTok rules`);
    
    // Update these scores to have the correct platform
    if (tikTokScores.length > 0) {
      const updatePromises = tikTokScores.map(score => 
        prisma.score.update({
          where: { id: score.id },
          data: { platform: 'TikTok' }
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Updated ${tikTokScores.length} scores to have platform 'TikTok'`);
    }
    
    // Verify the fix
    const updatedScores = await prisma.score.findMany({
      where: {
        platform: 'TikTok'
      },
      take: 5
    });
    
    console.log(`\nVerification: Found ${updatedScores.length} scores with platform 'TikTok'`);
    if (updatedScores.length > 0) {
      console.log('Sample TikTok scores:');
      updatedScores.forEach(score => {
        console.log(`Score ID: ${score.id}, Platform: ${score.platform}, Rule ID: ${score.ruleId}`);
      });
    }
    
  } catch (error) {
    console.error('Error fixing TikTok scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixTikTokScores()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
