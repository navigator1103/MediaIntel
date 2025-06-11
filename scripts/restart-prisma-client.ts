import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Restarting Prisma client...');
  
  try {
    // Create a new Prisma client instance
    const prisma = new PrismaClient();
    
    // Test connection by running a simple query
    console.log('Testing database connection...');
    const mediaTypes = await prisma.mediaType.findMany();
    console.log(`Connection successful. Found ${mediaTypes.length} media types:`);
    mediaTypes.forEach(type => {
      console.log(`- ${type.name} (ID: ${type.id})`);
    });
    
    // Disconnect the client
    await prisma.$disconnect();
    console.log('Prisma client disconnected successfully.');
    
    console.log('Prisma client restart completed.');
  } catch (error) {
    console.error('Error restarting Prisma client:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
