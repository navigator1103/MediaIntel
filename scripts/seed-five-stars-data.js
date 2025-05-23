const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFiveStarsData() {
  try {
    console.log('Starting to seed 5-star ratings data...');
    
    // Get all criteria
    const criteria = await prisma.fiveStarsCriterion.findMany();
    console.log(`Found ${criteria.length} criteria`);
    
    // Get countries
    const countries = await prisma.country.findMany();
    console.log(`Found ${countries.length} countries`);
    
    // Get brands
    const brands = await prisma.brand.findMany();
    console.log(`Found ${brands.length} brands`);
    
    if (criteria.length === 0 || countries.length === 0 || brands.length === 0) {
      console.error('Missing required data. Ensure you have criteria, countries, and brands in the database.');
      return;
    }
    
    // Current month for the ratings
    const currentMonth = '2025-04';
    
    // Delete existing ratings for the current month to avoid duplicates
    const deleteResult = await prisma.fiveStarsRating.deleteMany({
      where: { month: currentMonth }
    });
    console.log(`Deleted ${deleteResult.count} existing ratings for ${currentMonth}`);
    
    // Create ratings for each combination of country, brand, and criterion
    const ratingsToCreate = [];
    
    for (const country of countries) {
      for (const brand of brands) {
        for (const criterion of criteria) {
          // Generate a random rating between 1 and 5
          const rating = Math.floor(Math.random() * 5) + 1;
          
          ratingsToCreate.push({
            criterionId: criterion.id,
            countryId: country.id,
            brandId: brand.id,
            rating: rating,
            month: currentMonth,
            comments: `Auto-generated rating for ${brand.name} in ${country.name} - ${criterion.name}`
          });
        }
      }
    }
    
    console.log(`Prepared ${ratingsToCreate.length} ratings to create`);
    
    // Create ratings in batches to avoid overwhelming the database
    const batchSize = 100;
    let createdCount = 0;
    
    for (let i = 0; i < ratingsToCreate.length; i += batchSize) {
      const batch = ratingsToCreate.slice(i, i + batchSize);
      
      // Use createMany for efficiency, but fall back to individual creates if needed
      try {
        const result = await prisma.fiveStarsRating.createMany({
          data: batch
        });
        createdCount += result.count;
        console.log(`Created batch of ${result.count} ratings (${i + 1}-${Math.min(i + batchSize, ratingsToCreate.length)} of ${ratingsToCreate.length})`);
      } catch (error) {
        console.error('Error creating batch, falling back to individual creates:', error);
        
        // Fall back to individual creates
        for (const data of batch) {
          try {
            await prisma.fiveStarsRating.create({ data });
            createdCount++;
          } catch (createError) {
            console.error(`Failed to create rating for ${data.brandId}-${data.countryId}-${data.criterionId}:`, createError);
          }
        }
      }
    }
    
    console.log(`Successfully created ${createdCount} 5-star ratings for ${currentMonth}`);
    
    // Also create some data for the previous month for comparison
    const previousMonth = '2025-03';
    
    // Delete existing ratings for the previous month
    const deletePrevResult = await prisma.fiveStarsRating.deleteMany({
      where: { month: previousMonth }
    });
    console.log(`Deleted ${deletePrevResult.count} existing ratings for ${previousMonth}`);
    
    // Create ratings for previous month
    const prevRatingsToCreate = ratingsToCreate.map(r => ({
      ...r,
      month: previousMonth,
      // Slightly different ratings for the previous month
      rating: Math.min(Math.max(r.rating + (Math.random() > 0.5 ? 1 : -1), 1), 5),
      comments: `Auto-generated rating for ${previousMonth}`
    }));
    
    let prevCreatedCount = 0;
    
    for (let i = 0; i < prevRatingsToCreate.length; i += batchSize) {
      const batch = prevRatingsToCreate.slice(i, i + batchSize);
      
      try {
        const result = await prisma.fiveStarsRating.createMany({
          data: batch
        });
        prevCreatedCount += result.count;
        console.log(`Created batch of ${result.count} ratings for ${previousMonth} (${i + 1}-${Math.min(i + batchSize, prevRatingsToCreate.length)} of ${prevRatingsToCreate.length})`);
      } catch (error) {
        console.error('Error creating batch for previous month, falling back to individual creates:', error);
        
        for (const data of batch) {
          try {
            await prisma.fiveStarsRating.create({ data });
            prevCreatedCount++;
          } catch (createError) {
            console.error(`Failed to create rating for ${previousMonth}:`, createError);
          }
        }
      }
    }
    
    console.log(`Successfully created ${prevCreatedCount} 5-star ratings for ${previousMonth}`);
    
  } catch (error) {
    console.error('Error seeding 5-star ratings data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFiveStarsData()
  .then(() => console.log('Done seeding 5-star ratings data.'))
  .catch(e => console.error(e));
