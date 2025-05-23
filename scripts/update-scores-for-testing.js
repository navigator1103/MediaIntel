// Script to update some scores to lower values for testing change requests
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateScoresForTesting() {
  try {
    console.log('Updating scores for testing change requests...');
    
    // Find a few scores to update
    const scores = await prisma.score.findMany({
      take: 5, // Update 5 scores
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    
    if (scores.length === 0) {
      console.error('No scores found to update');
      return;
    }
    
    // Update each score to a value between 1 and 4
    for (const score of scores) {
      const newScore = Math.floor(Math.random() * 4) + 1; // Random value between 1 and 4
      
      await prisma.score.update({
        where: { id: score.id },
        data: { score: newScore }
      });
      
      console.log(`Updated score for rule: ${score.rule.name} in ${score.country.name} for ${score.brand.name} to ${newScore}`);
    }
    
    console.log('Successfully updated scores for testing');
    
  } catch (error) {
    console.error('Error updating scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateScoresForTesting();
