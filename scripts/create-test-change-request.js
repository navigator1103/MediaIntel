// Script to create a test change request
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestChangeRequest() {
  try {
    console.log('Creating a test change request...');
    
    // First, find a score to associate with the change request
    const score = await prisma.score.findFirst({
      where: {
        // Find a score that's not perfect (less than 5) so we can request an improvement
        score: { lt: 5 }
      },
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    
    if (!score) {
      console.error('No suitable score found to create a change request');
      return;
    }
    
    console.log(`Found score for rule: ${score.rule.title} in ${score.country.name} for ${score.brand.name}`);
    
    // Create a change request for this score
    const changeRequest = await prisma.changeRequest.create({
      data: {
        scoreId: score.id,
        requestedScore: Math.min(score.score + 1, 5), // Increase by 1, max of 5
        comments: 'Test change request - requesting score improvement based on recent implementation',
        status: 'Submitted for Review'
      },
      include: {
        score: {
          include: {
            rule: true,
            country: true,
            brand: true
          }
        }
      }
    });
    
    console.log('Successfully created change request:');
    console.log(`ID: ${changeRequest.id}`);
    console.log(`Rule: ${changeRequest.score.rule.title}`);
    console.log(`Current Score: ${score.score}`);
    console.log(`Requested Score: ${changeRequest.requestedScore}`);
    console.log(`Status: ${changeRequest.status}`);
    
  } catch (error) {
    console.error('Error creating test change request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestChangeRequest();
