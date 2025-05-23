import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanScoresDatabase() {
  try {
    console.log('Cleaning scores database...');

    // Get all scores
    const allScores = await prisma.score.findMany({
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    console.log(`Found ${allScores.length} scores in total`);

    // Group scores by rule, country, and month
    const scoreGroups: Record<string, any[]> = {};
    
    allScores.forEach(score => {
      const key = `${score.ruleId}-${score.countryId}-${score.month}`;
      if (!scoreGroups[key]) {
        scoreGroups[key] = [];
      }
      scoreGroups[key].push(score);
    });

    console.log(`Grouped scores into ${Object.keys(scoreGroups).length} unique rule-country-month combinations`);

    // For each group, keep only one score (the one with Brand A or the first one)
    const scoresToDelete: number[] = [];
    const scoresToKeep: number[] = [];

    for (const key in scoreGroups) {
      const group = scoreGroups[key];
      
      if (group.length > 1) {
        // Try to find a score with Brand A (id 1)
        const brandAScore = group.find(score => score.brandId === 1);
        const scoreToKeep = brandAScore || group[0];
        
        // Mark all other scores in this group for deletion
        group.forEach(score => {
          if (score.id !== scoreToKeep.id) {
            scoresToDelete.push(score.id);
          } else {
            scoresToKeep.push(score.id);
          }
        });
      } else {
        // If there's only one score in the group, keep it
        scoresToKeep.push(group[0].id);
      }
    }

    console.log(`Keeping ${scoresToKeep.length} scores and deleting ${scoresToDelete.length} duplicate scores`);

    if (scoresToDelete.length > 0) {
      // First, delete any change requests associated with these scores
      const deletedChangeRequests = await prisma.changeRequest.deleteMany({
        where: {
          scoreId: {
            in: scoresToDelete
          }
        }
      });
      console.log(`Deleted ${deletedChangeRequests.count} change requests associated with duplicate scores`);
      
      // Now delete the duplicate scores
      const deletedScores = await prisma.score.deleteMany({
        where: {
          id: {
            in: scoresToDelete
          }
        }
      });
      console.log(`Deleted ${deletedScores.count} duplicate scores`);
    }

    // Verify the remaining scores
    const remainingScores = await prisma.score.count();
    console.log(`Remaining scores: ${remainingScores}`);
    console.log('Scores cleanup completed successfully');
    
  } catch (error) {
    console.error('Error cleaning scores database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanScoresDatabase()
  .then(() => console.log('Cleanup completed'))
  .catch((error) => console.error('Cleanup failed:', error));
