// Script to add playbook_id column to game_plans table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPlaybookIdColumn() {
  try {
    console.log('Adding playbook_id column to game_plans table...');
    
    // Execute raw SQL to add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE game_plans ADD COLUMN playbook_id TEXT;
    `);
    
    console.log('Successfully added playbook_id column to game_plans table');
  } catch (error) {
    console.error('Error adding playbook_id column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPlaybookIdColumn();
