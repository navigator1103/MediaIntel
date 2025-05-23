import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding change requests...');

    // Get all scores to potentially create change requests for
    const scores = await prisma.score.findMany({
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });

    if (scores.length === 0) {
      console.log('No scores found. Please run the main seed script first.');
      return;
    }

    console.log(`Found ${scores.length} scores to potentially create change requests for`);

    // Get users for assigning to change requests
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('No users found. Please run the main seed script first.');
      return;
    }

    // Get existing change requests to avoid duplicates
    const existingRequests = await prisma.changeRequest.findMany();
    console.log(`Found ${existingRequests.length} existing change requests`);

    // Create a map of scoreId to existing requests
    const scoreRequestMap = new Map();
    existingRequests.forEach(request => {
      scoreRequestMap.set(request.scoreId, true);
    });

    // Create change requests for scores that don't already have them
    // We'll create a mix of statuses to demonstrate different states
    const statuses = ['Submitted for Review', 'Approved', 'Rejected'];
    let createdCount = 0;

    for (const score of scores) {
      // Skip if this score already has a change request
      if (scoreRequestMap.has(score.id)) {
        continue;
      }

      // Only create change requests for some scores (about 30%)
      if (Math.random() > 0.3) {
        continue;
      }

      // Generate a random requested score that's different from the current score
      let requestedScore;
      if (score.score < 80) {
        // If current score is low, request a higher score
        requestedScore = Math.min(100, score.score + Math.floor(Math.random() * 20) + 5);
      } else {
        // If current score is high, there's a chance to request a lower score (for realism)
        requestedScore = Math.random() > 0.7 
          ? Math.max(1, score.score - Math.floor(Math.random() * 15))
          : Math.min(100, score.score + Math.floor(Math.random() * 10));
      }

      // Randomly select a status
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Randomly assign to a user (or leave null for some)
      const userId = Math.random() > 0.2 
        ? users[Math.floor(Math.random() * users.length)].id 
        : null;

      // Create a realistic comment
      let comment = '';
      if (requestedScore > score.score) {
        comment = `Request to increase score from ${score.score} to ${requestedScore} for ${score.rule.title} in ${score.country.name} for ${score.brand.name}. Recent improvements include better implementation of best practices and addressing previous issues.`;
      } else {
        comment = `Request to adjust score from ${score.score} to ${requestedScore} for ${score.rule.title} in ${score.country.name} for ${score.brand.name}. Recent audit revealed some issues that need to be addressed.`;
      }

      // Create the change request
      await prisma.changeRequest.create({
        data: {
          scoreId: score.id,
          userId,
          requestedScore,
          comments: comment,
          status,
          // For approved/rejected requests, set the updatedAt to be a bit later than createdAt
          ...(status !== 'Submitted for Review' && {
            updatedAt: new Date(new Date().getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random time within the last week
          })
        }
      });

      createdCount++;
    }

    console.log(`Created ${createdCount} new change requests`);
    console.log('Change request seeding completed successfully');
  } catch (error) {
    console.error('Error seeding change requests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
