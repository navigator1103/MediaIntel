import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkScoresByPlatform() {
  try {
    console.log('Checking scores by platform...');
    
    // Get all scores
    const scores = await prisma.score.findMany({
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    
    // Group scores by platform
    const scoresByPlatform = scores.reduce((acc, score) => {
      const platform = score.rule.platform;
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(score);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Display summary by platform
    console.log('\nScores by platform:');
    for (const [platform, platformScores] of Object.entries(scoresByPlatform)) {
      console.log(`${platform}: ${platformScores.length} scores`);
      
      // Get unique countries and brands for this platform
      const countries = new Set(platformScores.map(score => score.country.name));
      const brands = new Set(platformScores.map(score => score.brand.name));
      
      console.log(`  Countries (${countries.size}): ${Array.from(countries).join(', ')}`);
      console.log(`  Brands (${brands.size}): ${Array.from(brands).join(', ')}`);
      console.log('');
    }
    
    // Create sample scores for other platforms if needed
    const platforms = ['Meta', 'TikTok', 'Google Ads'];
    const existingPlatforms = Object.keys(scoresByPlatform);
    
    const missingPlatforms = platforms.filter(p => !existingPlatforms.includes(p));
    
    if (missingPlatforms.length > 0) {
      console.log('\nMissing platforms:', missingPlatforms.join(', '));
      console.log('Would you like to create sample scores for these platforms? (This would require additional code)');
    }
    
  } catch (error) {
    console.error('Error checking scores by platform:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkScoresByPlatform()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
