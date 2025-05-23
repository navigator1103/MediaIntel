// Script to create test scores for different months in 2024 and 2025
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test scores for different months...');

    // Get some existing rules, countries, and brands to use
    const rules = await prisma.rule.findMany({ take: 3 });
    const countries = await prisma.country.findMany({ take: 2 });
    const brands = await prisma.brand.findMany({ take: 2 });

    if (rules.length === 0 || countries.length === 0 || brands.length === 0) {
      console.error('Error: Need at least one rule, country, and brand in the database');
      return;
    }

    // Create an array of months for 2024 and 2025
    const months = [];
    for (let year of [2024, 2025]) {
      for (let month = 1; month <= 12; month++) {
        months.push(`${year}-${String(month).padStart(2, '0')}`);
      }
    }

    // Create scores for each month, rule, country, and brand combination
    const platforms = ['Meta', 'Google Ads', 'TikTok', 'DV360'];
    
    for (const month of months) {
      for (const rule of rules) {
        for (const country of countries) {
          for (const brand of brands) {
            // Generate a random score between 30 and 100
            const score = Math.floor(Math.random() * 71) + 30;
            
            // Generate a random trend between -10 and +10
            const trend = Math.floor(Math.random() * 21) - 10;
            
            // Select a random platform
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            
            // Check if a score already exists for this combination
            const existingScore = await prisma.score.findFirst({
              where: {
                ruleId: rule.id,
                countryId: country.id,
                brandId: brand.id,
                month: month,
                platform: platform
              }
            });

            if (!existingScore) {
              // Create a new score
              await prisma.score.create({
                data: {
                  ruleId: rule.id,
                  countryId: country.id,
                  brandId: brand.id,
                  score: score,
                  trend: trend,
                  month: month,
                  platform: platform,
                  evaluation: score >= 80 ? 'Good' : score >= 60 ? 'Average' : 'Poor'
                }
              });
              
              console.log(`Created score for ${month}, Rule: ${rule.title}, Country: ${country.name}, Brand: ${brand.name}, Score: ${score}`);
            } else {
              console.log(`Score already exists for ${month}, Rule: ${rule.title}, Country: ${country.name}, Brand: ${brand.name}`);
            }
          }
        }
      }
    }

    console.log('Test scores created successfully!');
  } catch (error) {
    console.error('Error creating test scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
