const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFiveStarsData() {
  try {
    console.log('Checking FiveStarsCriterion table...');
    const criteria = await prisma.fiveStarsCriterion.findMany();
    console.log(`Found ${criteria.length} criteria:`);
    criteria.forEach(c => console.log(`- ID: ${c.id}, Name: ${c.name}`));
    
    console.log('\nChecking FiveStarsRating table...');
    const ratings = await prisma.fiveStarsRating.findMany({
      include: {
        country: true,
        brand: true,
        criterion: true
      }
    });
    console.log(`Found ${ratings.length} ratings.`);
    
    if (ratings.length > 0) {
      console.log('Sample ratings:');
      ratings.slice(0, 5).forEach(r => {
        console.log(`- Country: ${r.country.name}, Brand: ${r.brand.name}, Criterion: ${r.criterion.name}, Rating: ${r.rating}, Month: ${r.month}`);
      });
      
      // Group by month
      const monthCounts = {};
      ratings.forEach(r => {
        monthCounts[r.month] = (monthCounts[r.month] || 0) + 1;
      });
      
      console.log('\nRatings by month:');
      Object.entries(monthCounts).forEach(([month, count]) => {
        console.log(`- ${month}: ${count} ratings`);
      });
    } else {
      console.log('No ratings found in the database.');
    }
    
    // Check current month data
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const currentMonthRatings = await prisma.fiveStarsRating.findMany({
      where: { month: currentMonth },
      include: {
        country: true,
        brand: true,
        criterion: true
      }
    });
    
    console.log(`\nRatings for current month (${currentMonth}): ${currentMonthRatings.length}`);
    
    // Check for the month specified in the API default (2025-03)
    const apiDefaultMonth = '2025-03';
    const apiDefaultMonthRatings = await prisma.fiveStarsRating.findMany({
      where: { month: apiDefaultMonth },
      include: {
        country: true,
        brand: true,
        criterion: true
      }
    });
    
    console.log(`\nRatings for API default month (${apiDefaultMonth}): ${apiDefaultMonthRatings.length}`);
    
    // Check for the current application month (2025-04 based on the error message)
    const appCurrentMonth = '2025-04';
    const appCurrentMonthRatings = await prisma.fiveStarsRating.findMany({
      where: { month: appCurrentMonth },
      include: {
        country: true,
        brand: true,
        criterion: true
      }
    });
    
    console.log(`\nRatings for application current month (${appCurrentMonth}): ${appCurrentMonthRatings.length}`);
    
  } catch (error) {
    console.error('Error checking five stars data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFiveStarsData()
  .then(() => console.log('Done checking five stars data.'))
  .catch(e => console.error(e));
