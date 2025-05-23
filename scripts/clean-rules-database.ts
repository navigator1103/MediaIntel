import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanRulesDatabase() {
  try {
    console.log('Cleaning rules database...');

    // Get all rules
    const allRules = await prisma.rule.findMany();
    console.log(`Found ${allRules.length} rules in total`);

    // The IDs of the rules we want to keep (the ones we just updated)
    const validRuleIds = Array.from({ length: 50 }, (_, i) => i + 1); // IDs 1-50
    
    // Find rules to delete (rules not in our valid IDs list)
    const rulesToDelete = allRules.filter(rule => !validRuleIds.includes(rule.id));
    console.log(`Found ${rulesToDelete.length} rules to delete`);

    if (rulesToDelete.length > 0) {
      // Get IDs of rules to delete
      const ruleIdsToDelete = rulesToDelete.map(rule => rule.id);
      
      // First, find all scores associated with these rules
      const scoresToDelete = await prisma.score.findMany({
        where: {
          ruleId: {
            in: ruleIdsToDelete
          }
        }
      });
      
      const scoreIdsToDelete = scoresToDelete.map(score => score.id);
      console.log(`Found ${scoreIdsToDelete.length} scores associated with dummy rules`);
      
      if (scoreIdsToDelete.length > 0) {
        // Delete any change requests associated with these scores first
        const deletedChangeRequests = await prisma.changeRequest.deleteMany({
          where: {
            scoreId: {
              in: scoreIdsToDelete
            }
          }
        });
        console.log(`Deleted ${deletedChangeRequests.count} change requests associated with dummy scores`);
        
        // Now delete the scores
        const deletedScores = await prisma.score.deleteMany({
          where: {
            id: {
              in: scoreIdsToDelete
            }
          }
        });
        console.log(`Deleted ${deletedScores.count} scores associated with dummy rules`);
      }
      
      // Now delete the rules
      const deletedRules = await prisma.rule.deleteMany({
        where: {
          id: {
            in: ruleIdsToDelete
          }
        }
      });
      
      console.log(`Deleted ${deletedRules.count} dummy rules`);
    } else {
      console.log('No dummy rules found to delete');
    }

    // Verify the remaining rules
    const remainingRules = await prisma.rule.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`Remaining rules: ${remainingRules.length}`);
    console.log('Rules cleanup completed successfully');
    
    // Log platforms and counts
    const platforms = [...new Set(remainingRules.map(rule => rule.platform))];
    for (const platform of platforms) {
      const count = remainingRules.filter(rule => rule.platform === platform).length;
      console.log(`${platform}: ${count} rules`);
    }
    
  } catch (error) {
    console.error('Error cleaning rules database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanRulesDatabase()
  .then(() => console.log('Cleanup completed'))
  .catch((error) => console.error('Cleanup failed:', error));
