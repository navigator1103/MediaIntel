import { execSync } from 'child_process';
import * as path from 'path';

// Function to initialize the PostgreSQL database
async function initPostgres() {
  try {
    console.log('Initializing PostgreSQL database...');
    
    // Switch to PostgreSQL mode
    execSync('npx ts-node scripts/switch-db.ts postgres', { stdio: 'inherit' });
    
    // Create the database and run migrations
    console.log('Running Prisma migrations on PostgreSQL...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Seed the database
    console.log('Seeding PostgreSQL database...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    // Switch back to multi-database mode
    execSync('npx ts-node scripts/switch-db.ts multi', { stdio: 'inherit' });
    
    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
    process.exit(1);
  }
}

initPostgres();
