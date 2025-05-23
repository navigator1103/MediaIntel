// Script to create test scores for the real rules we just imported
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test scores for real rules...');

    // Get all rules, countries, and brands
    const rules = await prisma.rule.findMany();
    const countries = await prisma.country.findMany();
    const brands = await prisma.brand.findMany();

    if (rules.length === 0 || countries.length === 0 || brands.length === 0) {
      console.error('Error: Need at least one rule, country, and brand in the database');
      return;
    }

    console.log(`Found ${rules.length} rules, ${countries.length} countries, and ${brands.length} brands`);

    // Create scores for the current month and the previous month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Format current month as YYYY-MM
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Calculate previous month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    // Format previous month as YYYY-MM
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    
    console.log(`Creating scores for months: ${prevMonthStr} and ${currentMonthStr}`);

    // Create scores for each rule, country, and brand combination
    let createdCount = 0;
    
    for (const rule of rules) {
      for (const country of countries) {
        for (const brand of brands) {
          // Generate scores for current month
          const currentScore = Math.floor(Math.random() * 71) + 30; // 30-100
          
          // Generate scores for previous month (slightly different)
          const prevScore = Math.max(30, Math.min(100, currentScore + (Math.floor(Math.random() * 21) - 10)));
          
          // Calculate trend
          const trend = currentScore - prevScore;
          
          // Check if current month score already exists
          const existingCurrentScore = await prisma.score.findFirst({
            where: {
              ruleId: rule.id,
              countryId: country.id,
              brandId: brand.id,
              month: currentMonthStr,
              platform: rule.platform
            }
          });

          if (!existingCurrentScore) {
            // Create score for current month
            await prisma.score.create({
              data: {
                ruleId: rule.id,
                countryId: country.id,
                brandId: brand.id,
                score: currentScore,
                trend: trend,
                month: currentMonthStr,
                platform: rule.platform,
                evaluation: currentScore >= 80 ? 'Good' : currentScore >= 60 ? 'Average' : 'Poor'
              }
            });
            createdCount++;
          }
          
          // Check if previous month score already exists
          const existingPrevScore = await prisma.score.findFirst({
            where: {
              ruleId: rule.id,
              countryId: country.id,
              brandId: brand.id,
              month: prevMonthStr,
              platform: rule.platform
            }
          });

          if (!existingPrevScore) {
            // Create score for previous month
            await prisma.score.create({
              data: {
                ruleId: rule.id,
                countryId: country.id,
                brandId: brand.id,
                score: prevScore,
                trend: 0, // No trend for previous month
                month: prevMonthStr,
                platform: rule.platform,
                evaluation: prevScore >= 80 ? 'Good' : prevScore >= 60 ? 'Average' : 'Poor'
              }
            });
            createdCount++;
          }
        }
      }
      
      console.log(`Created scores for rule: ${rule.platform} - ${rule.title}`);
    }

    console.log(`Successfully created ${createdCount} new scores for real rules.`);
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
