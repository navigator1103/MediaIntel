// Script to clear all change requests from the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearChangeRequests() {
  try {
    console.log('Clearing all change requests from the database...');
    
    // Delete all change requests
    const result = await prisma.changeRequest.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} change requests.`);
  } catch (error) {
    console.error('Error clearing change requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearChangeRequests();
