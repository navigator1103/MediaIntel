import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateScores() {
  try {
    console.log('Starting scores update...');
    
    // Define the updated countries
    const updatedCountries = [
      { id: 1, name: 'Brazil' },
      { id: 2, name: 'India' },
      { id: 3, name: 'South Africa' },
      { id: 4, name: 'Mexico' },
      { id: 5, name: 'Chile' },
      { id: 6, name: 'Thailand' }
    ];
    
    // Get all rules
    const rules = await prisma.rule.findMany();
    
    // Current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Generate random scores for each country and rule
    for (const country of updatedCountries) {
      for (const rule of rules) {
        // Generate a random score between 60 and 100
        const score = Math.floor(Math.random() * 41) + 60;
        
        // Check if a score already exists for this country and rule
        const existingScore = await prisma.score.findFirst({
          where: {
            countryId: country.id,
            ruleId: rule.id,
            month: currentMonth
          }
        });
        
        if (existingScore) {
          // Update existing score
          await prisma.score.update({
            where: { id: existingScore.id },
            data: { score }
          });
          console.log(`Updated score for ${country.name}, rule ${rule.id}: ${score}`);
        } else {
          // Create new score
          await prisma.score.create({
            data: {
              countryId: country.id,
              ruleId: rule.id,
              brandId: 1, // Default to first brand
              month: currentMonth,
              score
            }
          });
          console.log(`Created score for ${country.name}, rule ${rule.id}: ${score}`);
        }
      }
    }
    
    console.log('Scores update completed successfully!');
  } catch (error) {
    console.error('Error updating scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateScores();
