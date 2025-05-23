// Script to check available Prisma models
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Log all available models on the Prisma client
console.log('Available models on the Prisma client:');
console.log(Object.keys(prisma));

// Try to access specific models
try {
  console.log('\nChecking specific models:');
  console.log('BusinessUnit exists:', !!prisma.businessUnit);
  console.log('businessUnit exists:', !!prisma.businessUnit);
  console.log('PMType exists:', !!prisma.pMType);
  console.log('pMType exists:', !!prisma.pMType);
} catch (error) {
  console.error('Error checking models:', error);
}

// Close the Prisma client
prisma.$disconnect();
