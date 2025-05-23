import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkMasterDataSync() {
  console.log('Checking master data synchronization between PostgreSQL and SQLite...');
  
  // First, check which database we're currently connected to
  console.log('Current DATABASE_URL:', process.env.DATABASE_URL);
  
  // Check data in the current database (should be PostgreSQL)
  const prisma = new PrismaClient();
  
  try {
    console.log('\n=== Current Database (PostgreSQL) ===');
    await checkDatabase(prisma);
    
    // Now switch to SQLite database
    console.log('\n=== Switching to SQLite Database ===');
    process.env.DATABASE_URL = 'file:./prisma/dev.db';
    
    // Create a new Prisma client with the SQLite connection
    await prisma.$disconnect();
    const sqlitePrisma = new PrismaClient();
    
    console.log('\n=== SQLite Database ===');
    await checkDatabase(sqlitePrisma);
    
    await sqlitePrisma.$disconnect();
  } catch (error) {
    console.error('Error checking database synchronization:', error);
  }
}

async function checkDatabase(prisma: PrismaClient) {
  // Check categories
  const categories = await prisma.category.findMany();
  console.log(`Found ${categories.length} categories`);
  
  if (categories.length > 0) {
    console.log('Sample categories:');
    categories.slice(0, 5).forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });
  }
  
  // Check ranges
  const ranges = await prisma.range.findMany();
  console.log(`Found ${ranges.length} ranges`);
  
  if (ranges.length > 0) {
    console.log('Sample ranges:');
    ranges.slice(0, 5).forEach(range => {
      console.log(`- ${range.name} (ID: ${range.id})`);
    });
  }
  
  // Check category-range relationships
  try {
    const relationships = await prisma.$queryRaw<{category_id: number, range_id: number}[]>`
      SELECT category_id, range_id FROM ms_category_to_range LIMIT 5
    `;
    
    console.log(`Found ${relationships.length} category-range relationships (showing first 5)`);
    
    if (relationships.length > 0) {
      for (const rel of relationships) {
        const category = await prisma.category.findUnique({ where: { id: rel.category_id } });
        const range = await prisma.range.findUnique({ where: { id: rel.range_id } });
        console.log(`- Category "${category?.name}" (ID: ${rel.category_id}) -> Range "${range?.name}" (ID: ${rel.range_id})`);
      }
    }
  } catch (error) {
    console.error('Error querying relationships:', error);
  }
}

checkMasterDataSync().catch(console.error);
