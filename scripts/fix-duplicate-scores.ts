import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateScores() {
  try {
    console.log('Checking for duplicate scores...');
    
    // Find all scores for rule ID 3 (the duplicated rule)
    const rule3Scores = await prisma.score.findMany({
      where: {
        ruleId: 3
      },
      include: {
        country: true,
        brand: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log(`Found ${rule3Scores.length} scores for rule #3`);
    
    // Group scores by country and brand to identify duplicates
    const scoreGroups = rule3Scores.reduce((acc, score) => {
      const key = `${score.countryId}-${score.brandId}-${score.month}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(score);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Find groups with more than one score (duplicates)
    const duplicateGroups = Object.entries(scoreGroups).filter(([_, scores]) => scores.length > 1);
    
    console.log(`Found ${duplicateGroups.length} groups with duplicate scores`);
    
    // For each group of duplicates, keep the first one and delete the rest
    for (const [key, scores] of duplicateGroups) {
      const [keep, ...duplicates] = scores;
      
      console.log(`Group ${key}: Keeping score ID ${keep.id} for ${keep.country.name}/${keep.brand.name}, deleting ${duplicates.length} duplicates`);
      
      // Delete the duplicate scores
      for (const dupe of duplicates) {
        await prisma.score.delete({
          where: {
            id: dupe.id
          }
        });
        console.log(`Deleted duplicate score ID ${dupe.id}`);
      }
    }
    
    console.log('Duplicate scores cleanup completed successfully!');
  } catch (error) {
    console.error('Error fixing duplicate scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixDuplicateScores()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
