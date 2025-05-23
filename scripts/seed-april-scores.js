const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAprilScores() {
  try {
    console.log('Starting to seed Golden Rules scores for April 2025...');
    
    // Set the month for the new scores
    const month = '2025-04';
    
    // Delete any existing scores for April 2025 to avoid duplicates
    console.log(`Deleting existing scores for ${month}...`);
    const deleteResult = await prisma.score.deleteMany({
      where: { month }
    });
    console.log(`Deleted ${deleteResult.count} existing scores for ${month}`);
    
    // Get all rules
    const rules = await prisma.rule.findMany({
      where: { status: 'active' }
    });
    console.log(`Found ${rules.length} active rules`);
    
    // Get all countries
    const countries = await prisma.country.findMany();
    console.log(`Found ${countries.length} countries`);
    
    // Get all brands
    const brands = await prisma.brand.findMany();
    console.log(`Found ${brands.length} brands`);
    
    // Get March 2025 scores to calculate trends
    const previousMonth = '2025-03';
    const previousScores = await prisma.score.findMany({
      where: { month: previousMonth }
    });
    console.log(`Found ${previousScores.length} scores from ${previousMonth} for trend calculation`);
    
    // Create a map of previous scores for quick lookup
    const previousScoreMap = {};
    previousScores.forEach(score => {
      const key = `${score.ruleId}-${score.countryId}-${score.brandId}`;
      previousScoreMap[key] = score.score;
    });
    
    // Prepare scores to create
    const scoresToCreate = [];
    
    for (const rule of rules) {
      for (const country of countries) {
        for (const brand of brands) {
          // Generate a score between 40 and 100
          const score = Math.floor(Math.random() * 61) + 40;
          
          // Calculate trend based on previous month's score
          const key = `${rule.id}-${country.id}-${brand.id}`;
          const previousScore = previousScoreMap[key] || score;
          const trend = score - previousScore;
          
          // Determine evaluation based on score
          let evaluation = 'NA';
          if (score < 50) {
            evaluation = 'Poor';
          } else if (score < 70) {
            evaluation = 'Fair';
          } else if (score < 85) {
            evaluation = 'Good';
          } else {
            evaluation = 'Excellent';
          }
          
          // Determine status based on trend
          let status = 'Normal';
          if (trend < -10) {
            status = 'Declining';
          } else if (trend > 10) {
            status = 'Improving';
          }
          
          scoresToCreate.push({
            ruleId: rule.id,
            platform: rule.platform,
            countryId: country.id,
            brandId: brand.id,
            score,
            trend,
            month,
            evaluation,
            status
          });
        }
      }
    }
    
    console.log(`Prepared ${scoresToCreate.length} scores to create`);
    
    // Create scores in batches to avoid overwhelming the database
    const batchSize = 100;
    let createdCount = 0;
    
    for (let i = 0; i < scoresToCreate.length; i += batchSize) {
      const batch = scoresToCreate.slice(i, i + batchSize);
      
      try {
        const result = await prisma.score.createMany({
          data: batch
        });
        createdCount += result.count;
        console.log(`Created batch of ${result.count} scores (${i + 1}-${Math.min(i + batchSize, scoresToCreate.length)} of ${scoresToCreate.length})`);
      } catch (error) {
        console.error('Error creating batch, falling back to individual creates:', error);
        
        // Fall back to individual creates
        for (const data of batch) {
          try {
            await prisma.score.create({ data });
            createdCount++;
          } catch (createError) {
            console.error(`Failed to create score for rule ${data.ruleId}, country ${data.countryId}, brand ${data.brandId}:`, createError);
          }
        }
      }
    }
    
    console.log(`Successfully created ${createdCount} Golden Rules scores for ${month}`);
    
    // Summarize scores by platform
    const scoresByPlatform = {};
    scoresToCreate.forEach(score => {
      if (!scoresByPlatform[score.platform]) {
        scoresByPlatform[score.platform] = 0;
      }
      scoresByPlatform[score.platform]++;
    });
    
    console.log('\nScores created by platform:');
    Object.entries(scoresByPlatform).forEach(([platform, count]) => {
      console.log(`- ${platform}: ${count} scores`);
    });
    
  } catch (error) {
    console.error('Error seeding April scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAprilScores()
  .then(() => console.log('Done seeding April 2025 Golden Rules scores.'))
  .catch(e => console.error(e));
