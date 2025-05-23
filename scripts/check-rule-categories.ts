import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRuleCategories() {
  try {
    console.log('Checking rule categories in the database...');
    
    // Get all distinct categories from rules
    const ruleCategories = await prisma.rule.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    });
    
    console.log('\nAll categories in Rules table:');
    console.table(ruleCategories);
    
    // Get categories by platform
    const platforms = ['Google DV360', 'Meta', 'TikTok', 'Google Ads'];
    
    for (const platform of platforms) {
      const platformRules = await prisma.rule.findMany({
        where: {
          platform
        },
        select: {
          id: true,
          category: true
        }
      });
      
      const categoryCounts = platformRules.reduce((acc, rule) => {
        acc[rule.category] = (acc[rule.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`\nCategories for ${platform}:`);
      console.table(Object.entries(categoryCounts).map(([category, count]) => ({ category, count })));
    }
    
    // Check which categories have scores
    const scoreCategories = await prisma.score.findMany({
      include: {
        rule: {
          select: {
            category: true
          }
        }
      },
      take: 1000
    });
    
    const categoriesWithScores = scoreCategories.reduce((acc, score) => {
      const category = score.rule.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nCategories with scores:');
    console.table(Object.entries(categoriesWithScores).map(([category, count]) => ({ category, count })));
    
    // Check if there are any scores for Right Time and Right Cost categories
    const rightTimeScores = await prisma.score.count({
      where: {
        rule: {
          category: 'Right Time'
        }
      }
    });
    
    const rightCostScores = await prisma.score.count({
      where: {
        rule: {
          category: 'Right Cost'
        }
      }
    });
    
    console.log(`\nNumber of scores for Right Time category: ${rightTimeScores}`);
    console.log(`Number of scores for Right Cost category: ${rightCostScores}`);
    
  } catch (error) {
    console.error('Error checking rule categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkRuleCategories()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
