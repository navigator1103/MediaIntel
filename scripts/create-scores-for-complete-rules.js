// Script to create test scores for the complete set of real rules
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test scores for complete set of rules...');

    // Get all rules, countries, and brands
    const rules = await prisma.rule.findMany();
    const countries = await prisma.country.findMany();
    const brands = await prisma.brand.findMany();

    if (rules.length === 0 || countries.length === 0 || brands.length === 0) {
      console.error('Error: Need at least one rule, country, and brand in the database');
      return;
    }

    console.log(`Found ${rules.length} rules, ${countries.length} countries, and ${brands.length} brands`);

    // Create scores for months in 2024 and 2025
    const months = [];
    
    // Add months for 2024
    for (let i = 1; i <= 12; i++) {
      months.push(`2024-${String(i).padStart(2, '0')}`);
    }
    
    // Add months for 2025 (up to current month)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (currentYear === 2025) {
      for (let i = 1; i <= currentMonth; i++) {
        months.push(`2025-${String(i).padStart(2, '0')}`);
      }
    }
    
    console.log(`Creating scores for ${months.length} months: ${months.join(', ')}`);

    // Delete existing scores if requested
    const shouldClearExisting = process.argv.includes('--clear');
    if (shouldClearExisting) {
      console.log('Clearing existing scores...');
      
      // First delete related change requests
      await prisma.changeRequest.deleteMany();
      
      // Then delete scores
      await prisma.score.deleteMany();
      
      console.log('Existing scores cleared.');
    }

    // Create scores for each rule, country, and brand combination
    let createdCount = 0;
    let skippedCount = 0;
    
    // Process in batches to avoid memory issues
    for (const rule of rules) {
      for (const country of countries) {
        for (const brand of brands) {
          let previousScore = Math.floor(Math.random() * 41) + 60; // Start with 60-100
          
          for (let i = 0; i < months.length; i++) {
            const month = months[i];
            
            // Generate a score that has some relationship to the previous month's score
            // This creates more realistic trends over time
            let currentScore;
            
            if (i === 0) {
              currentScore = previousScore;
            } else {
              // Generate a change between -10 and +10 points
              const change = Math.floor(Math.random() * 21) - 10;
              currentScore = Math.max(30, Math.min(100, previousScore + change));
            }
            
            // Calculate trend compared to previous month
            const trend = i === 0 ? 0 : currentScore - previousScore;
            
            // Check if score already exists
            const existingScore = await prisma.score.findFirst({
              where: {
                ruleId: rule.id,
                countryId: country.id,
                brandId: brand.id,
                month: month,
                platform: rule.platform
              }
            });

            if (!existingScore) {
              // Create score
              await prisma.score.create({
                data: {
                  ruleId: rule.id,
                  countryId: country.id,
                  brandId: brand.id,
                  score: currentScore,
                  trend: trend,
                  month: month,
                  platform: rule.platform,
                  evaluation: currentScore >= 80 ? 'Good' : currentScore >= 60 ? 'Average' : 'Poor'
                }
              });
              createdCount++;
              
              // Occasionally create a change request for some scores
              if (Math.random() < 0.05) { // 5% chance
                await prisma.changeRequest.create({
                  data: {
                    scoreId: (await prisma.score.findFirst({
                      where: {
                        ruleId: rule.id,
                        countryId: country.id,
                        brandId: brand.id,
                        month: month
                      }
                    })).id,
                    requestedScore: Math.min(100, currentScore + 10),
                    comments: `Request to improve score for ${rule.platform} - ${rule.title} in ${month}`,
                    status: ['Submitted for Review', 'In Review', 'Approved', 'Rejected'][Math.floor(Math.random() * 4)]
                  }
                });
              }
            } else {
              skippedCount++;
            }
            
            // Update previous score for next iteration
            previousScore = currentScore;
          }
        }
      }
      
      console.log(`Created scores for rule: ${rule.platform} - ${rule.title}`);
    }

    console.log(`Successfully created ${createdCount} new scores (skipped ${skippedCount} existing scores).`);
    
    // Count scores by platform
    const metaScores = await prisma.score.count({ where: { platform: 'Meta' } });
    const googleScores = await prisma.score.count({ where: { platform: 'Google Ads' } });
    const tiktokScores = await prisma.score.count({ where: { platform: 'TikTok' } });
    const dv360Scores = await prisma.score.count({ where: { platform: 'DV360' } });
    
    console.log(`Scores by platform: Meta (${metaScores}), Google Ads (${googleScores}), TikTok (${tiktokScores}), DV360 (${dv360Scores})`);
    
    // Count change requests
    const changeRequests = await prisma.changeRequest.count();
    console.log(`Total change requests created: ${changeRequests}`);
  } catch (error) {
    console.error('Error creating scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
