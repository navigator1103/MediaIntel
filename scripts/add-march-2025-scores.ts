import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMarch2025Scores() {
  try {
    console.log('Adding scores for March 2025...');

    // Set the month to March 2025
    const month = '2025-03';
    
    // Get all rules, countries, and brands
    const rules = await prisma.rule.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    
    const countries = await prisma.country.findMany();
    const brands = await prisma.brand.findMany();
    
    console.log(`Found ${rules.length} rules, ${countries.length} countries, and ${brands.length} brands`);

    // Check if scores already exist for March 2025
    const existingScores = await prisma.score.findMany({
      where: {
        month
      }
    });
    
    if (existingScores.length > 0) {
      console.log(`Found ${existingScores.length} existing scores for March 2025. Deleting them first...`);
      
      // Get IDs of existing scores
      const existingScoreIds = existingScores.map(score => score.id);
      
      // Delete any change requests associated with these scores
      const deletedChangeRequests = await prisma.changeRequest.deleteMany({
        where: {
          scoreId: {
            in: existingScoreIds
          }
        }
      });
      console.log(`Deleted ${deletedChangeRequests.count} change requests associated with existing March 2025 scores`);
      
      // Delete existing scores
      const deletedScores = await prisma.score.deleteMany({
        where: {
          month
        }
      });
      console.log(`Deleted ${deletedScores.count} existing March 2025 scores`);
    }

    // Create scores for each rule and country combination (using only the first brand for simplicity)
    if (brands.length === 0) {
      throw new Error('No brands found in the database');
    }
    
    // Use the first available brand
    const firstBrand = brands[0];
    console.log(`Using brand: ${firstBrand.name} (ID: ${firstBrand.id})`);
    
    // Log all available brands for debugging
    console.log('Available brands:', brands.map(b => `${b.name} (ID: ${b.id})`).join(', '));

    let createdScores = 0;
    
    // Create scores for each rule and country
    for (const rule of rules) {
      for (const country of countries) {
        // Generate a random score between 60 and 100
        const score = Math.floor(Math.random() * 41) + 60;
        
        await prisma.score.create({
          data: {
            ruleId: rule.id,
            platform: rule.platform,
            countryId: country.id,
            brandId: firstBrand.id,
            score,
            trend: Math.floor(Math.random() * 11) - 5, // Random trend between -5 and +5
            month,
            evaluation: score >= 80 ? 'Good' : score >= 70 ? 'Average' : 'Poor'
          }
        });
        
        createdScores++;
      }
    }
    
    console.log(`Created ${createdScores} scores for March 2025`);
    console.log('Scores added successfully');
    
  } catch (error) {
    console.error('Error adding March 2025 scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMarch2025Scores()
  .then(() => console.log('Process completed'))
  .catch((error) => console.error('Process failed:', error));
