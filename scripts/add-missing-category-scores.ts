import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingCategoryScores() {
  try {
    console.log('Adding missing category scores...');
    
    // Get all platforms, countries, brands, and rules
    const platforms = ['Google DV360', 'Meta', 'TikTok', 'Google Ads'];
    const countries = await prisma.country.findMany({ take: 5 });
    const brands = await prisma.brand.findMany({ take: 3 });
    
    // Current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // For each platform, ensure we have scores for all categories
    for (const platform of platforms) {
      console.log(`\nProcessing platform: ${platform}`);
      
      // Get rules for this platform by category
      const rulesByCategory = {
        'Right Person': await prisma.rule.findMany({
          where: { platform, category: 'Right Person' }
        }),
        'Right Place': await prisma.rule.findMany({
          where: { platform, category: 'Right Place' }
        }),
        'Right Time': await prisma.rule.findMany({
          where: { platform, category: 'Right Time' }
        }),
        'Right Cost': await prisma.rule.findMany({
          where: { platform, category: 'Right Cost' }
        })
      };
      
      // Log rule counts by category
      console.log('Rules by category:');
      for (const [category, rules] of Object.entries(rulesByCategory)) {
        console.log(`  ${category}: ${rules.length} rules`);
      }
      
      // Get existing scores for this platform
      const existingScores = await prisma.score.findMany({
        where: { platform },
        select: {
          ruleId: true,
          countryId: true,
          brandId: true,
          month: true
        }
      });
      
      // Create a set of existing score keys for quick lookup
      const existingScoreKeys = new Set(
        existingScores.map(score => `${score.ruleId}-${score.countryId}-${score.brandId}-${score.month}`)
      );
      
      // Track created scores by category
      const createdScores: Record<string, number> = {
        'Right Person': 0,
        'Right Place': 0,
        'Right Time': 0,
        'Right Cost': 0
      };
      
      // For each category, create scores if needed
      for (const [category, rules] of Object.entries(rulesByCategory)) {
        if (rules.length === 0) {
          console.log(`  No rules found for ${category} category for ${platform}`);
          continue;
        }
        
        // For each country and brand, create scores for this category's rules
        for (const country of countries) {
          for (const brand of brands) {
            for (const rule of rules) {
              // Create a unique key for this score
              const scoreKey = `${rule.id}-${country.id}-${brand.id}-${currentMonth}`;
              
              // Skip if this score already exists
              if (existingScoreKeys.has(scoreKey)) {
                continue;
              }
              
              // Generate a random score between 60 and 100
              const score = Math.floor(Math.random() * 41) + 60;
              
              // Generate a random trend between -2 and 2
              const trend = Math.floor(Math.random() * 5) - 2;
              
              // Create the score
              await prisma.score.create({
                data: {
                  ruleId: rule.id,
                  countryId: country.id,
                  brandId: brand.id,
                  platform,
                  score,
                  trend,
                  month: currentMonth,
                  evaluation: 'Auto-generated',
                  status: 'Normal'
                }
              });
              
              createdScores[category]++;
              existingScoreKeys.add(scoreKey);
            }
          }
        }
      }
      
      // Log created scores by category
      console.log('Created scores by category:');
      for (const [category, count] of Object.entries(createdScores)) {
        console.log(`  ${category}: ${count} scores created`);
      }
    }
    
    console.log('\nFinished adding missing category scores.');
    
  } catch (error) {
    console.error('Error adding missing category scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingCategoryScores()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
