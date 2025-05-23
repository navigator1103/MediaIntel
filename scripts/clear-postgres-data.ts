import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma client for PostgreSQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL || 
           require('fs').readFileSync('.postgres-url', 'utf8').trim().replace(/^"|"$/g, '')
    }
  }
});

async function clearPostgresData() {
  console.log('Starting to clear PostgreSQL data...');
  
  try {
    // Delete data from tables in the correct order to respect foreign key constraints
    console.log('Deleting campaign media records...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_campaign_media CASCADE;`;
    
    console.log('Deleting campaigns...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_campaigns CASCADE;`;
    
    console.log('Deleting category to range mappings...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_category_to_range CASCADE;`;
    
    console.log('Deleting ranges...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_ranges CASCADE;`;
    
    console.log('Deleting categories...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_categories CASCADE;`;
    
    console.log('Deleting media subtypes...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_media_subtypes CASCADE;`;
    
    console.log('Deleting media types...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_media_types CASCADE;`;
    
    console.log('Deleting countries...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_countries CASCADE;`;
    
    console.log('Deleting sub regions...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_sub_regions CASCADE;`;
    
    console.log('Deleting business units...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_business_units CASCADE;`;
    
    console.log('Deleting PM types...');
    await prisma.$executeRaw`TRUNCATE TABLE ms_pm_types CASCADE;`;
    
    console.log('All PostgreSQL data has been cleared successfully!');
  } catch (error) {
    console.error('Error clearing PostgreSQL data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
clearPostgresData()
  .then(() => {
    console.log('Database clearing operation completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error during database clearing:', error);
    process.exit(1);
  });
