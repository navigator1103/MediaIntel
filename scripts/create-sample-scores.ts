import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleScores() {
  try {
    console.log('Creating sample scores for all platforms...');
    
    // Get existing countries and brands
    const countries = await prisma.country.findMany();
    const brands = await prisma.brand.findMany();
    
    // Get rules by platform
    const googleDV360Rules = await prisma.rule.findMany({
      where: { platform: 'Google DV360' }
    });
    
    const metaRules = await prisma.rule.findMany({
      where: { platform: 'Meta' }
    });
    
    const tiktokRules = await prisma.rule.findMany({
      where: { platform: 'TikTok' }
    });
    
    const googleAdsRules = await prisma.rule.findMany({
      where: { platform: 'Google Ads' }
    });
    
    console.log(`Found ${googleDV360Rules.length} Google DV360 rules`);
    console.log(`Found ${metaRules.length} Meta rules`);
    console.log(`Found ${tiktokRules.length} TikTok rules`);
    console.log(`Found ${googleAdsRules.length} Google Ads rules`);
    
    // Current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Create sample scores for each platform
    const platforms = [
      { name: 'Google DV360', rules: googleDV360Rules },
      { name: 'Meta', rules: metaRules },
      { name: 'Google Ads', rules: googleAdsRules }
    ];
    
    // Only create scores for countries and brands that don't already have scores
    // Get existing scores to avoid duplicates
    const existingScores = await prisma.score.findMany({
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
    
    // Track created scores
    let createdScores = 0;
    
    // Create scores for each platform
    for (const platform of platforms) {
      console.log(`\nCreating scores for ${platform.name}...`);
      
      for (const country of countries.slice(0, 5)) { // Limit to 5 countries
        for (const brand of brands.slice(0, 3)) { // Limit to 3 brands
          for (const rule of platform.rules) {
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
                platform: platform.name,
                score,
                trend,
                month: currentMonth,
                evaluation: 'Auto-generated',
                status: 'Normal'
              }
            });
            
            createdScores++;
          }
        }
      }
    }
    
    console.log(`\nCreated ${createdScores} sample scores for all platforms.`);
    
  } catch (error) {
    console.error('Error creating sample scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleScores()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
