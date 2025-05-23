const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEntities() {
  try {
    // Check platforms (from rules)
    console.log('Checking available platforms...');
    const platforms = await prisma.$queryRaw`SELECT DISTINCT platform FROM rules`;
    console.log(`Found ${platforms.length} platforms:`);
    platforms.forEach(p => console.log(`- ${p.platform}`));
    
    // Check rules
    console.log('\nChecking rules...');
    const rules = await prisma.rule.findMany({
      orderBy: { platform: 'asc' }
    });
    console.log(`Found ${rules.length} rules.`);
    console.log('Sample rules by platform:');
    
    // Group rules by platform
    const rulesByPlatform = {};
    rules.forEach(rule => {
      if (!rulesByPlatform[rule.platform]) {
        rulesByPlatform[rule.platform] = [];
      }
      rulesByPlatform[rule.platform].push(rule);
    });
    
    // Show sample rules for each platform
    Object.entries(rulesByPlatform).forEach(([platform, platformRules]) => {
      console.log(`\n${platform} (${platformRules.length} rules):`);
      platformRules.slice(0, 3).forEach(rule => {
        console.log(`  - ID: ${rule.id}, Title: ${rule.title}`);
      });
      if (platformRules.length > 3) {
        console.log(`  - ... and ${platformRules.length - 3} more`);
      }
    });
    
    // Check countries
    console.log('\nChecking countries...');
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
    console.log(`Found ${countries.length} countries.`);
    console.log('Sample countries:');
    countries.slice(0, 5).forEach(country => {
      console.log(`- ID: ${country.id}, Name: ${country.name}`);
    });
    if (countries.length > 5) {
      console.log(`- ... and ${countries.length - 5} more`);
    }
    
    // Check brands
    console.log('\nChecking brands...');
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    console.log(`Found ${brands.length} brands.`);
    console.log('Brands:');
    brands.forEach(brand => {
      console.log(`- ID: ${brand.id}, Name: ${brand.name}`);
    });
    
    // Check existing scores for April 2025
    const month = '2025-04';
    console.log(`\nChecking existing scores for ${month}...`);
    const existingScores = await prisma.score.findMany({
      where: { month },
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    console.log(`Found ${existingScores.length} existing scores for ${month}.`);
    
    if (existingScores.length > 0) {
      console.log('Sample existing scores:');
      existingScores.slice(0, 3).forEach(score => {
        console.log(`- Brand: ${score.brand.name}, Country: ${score.country.name}, Rule: ${score.rule.title}, Platform: ${score.rule.platform}, Score: ${score.score}`);
      });
      
      // Group by platform
      const scoresByPlatform = {};
      existingScores.forEach(score => {
        if (!scoresByPlatform[score.rule.platform]) {
          scoresByPlatform[score.rule.platform] = 0;
        }
        scoresByPlatform[score.rule.platform]++;
      });
      
      console.log('\nExisting scores by platform:');
      Object.entries(scoresByPlatform).forEach(([platform, count]) => {
        console.log(`- ${platform}: ${count} scores`);
      });
    }
    
  } catch (error) {
    console.error('Error checking entities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEntities()
  .then(() => console.log('Done checking entities.'))
  .catch(e => console.error(e));
