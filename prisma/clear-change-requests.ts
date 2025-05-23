import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Clearing all change requests from the database...');

    // Get count of existing change requests
    const existingCount = await prisma.changeRequest.count();
    console.log(`Found ${existingCount} change requests to delete`);

    // Delete all change requests
    const result = await prisma.changeRequest.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} change requests`);
    
    // Reset any scores that might have their status set to "Submitted for Review"
    const updatedScores = await prisma.score.updateMany({
      where: {
        status: 'Submitted for Review'
      },
      data: {
        status: 'Normal'
      }
    });
    
    console.log(`Reset status for ${updatedScores.count} scores back to Normal`);
    
    console.log('Change request cleanup completed successfully');
  } catch (error) {
    console.error('Error clearing change requests:', error);
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
