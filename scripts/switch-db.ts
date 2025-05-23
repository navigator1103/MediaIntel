import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Get the database mode from command line arguments or .env
const args = process.argv.slice(2);
const dbMode = args[0] || process.env.DB_MODE || 'sqlite';

// Paths
const prismaDir = path.join(process.cwd(), 'prisma');
const schemaPath = path.join(prismaDir, 'schema.prisma');
const sqliteSchemaPath = path.join(prismaDir, 'schema.sqlite.prisma');
const pgSchemaPath = path.join(prismaDir, 'schema.postgres.prisma');

// Function to switch database mode
async function switchDb() {
  try {
    console.log(`Switching to ${dbMode} database mode...`);
    
    // Backup the current schema if it doesn't exist
    if (!fs.existsSync(sqliteSchemaPath)) {
      fs.copyFileSync(schemaPath, sqliteSchemaPath);
      console.log('Backed up SQLite schema');
    }
    
    // Copy the appropriate schema
    if (dbMode === 'postgres') {
      if (!fs.existsSync(pgSchemaPath)) {
        console.error('PostgreSQL schema not found. Run setup-multi-db.ts first.');
        process.exit(1);
      }
      fs.copyFileSync(pgSchemaPath, schemaPath);
      console.log('Switched to PostgreSQL schema');
    } else if (dbMode === 'sqlite') {
      fs.copyFileSync(sqliteSchemaPath, schemaPath);
      console.log('Switched to SQLite schema');
    } else if (dbMode === 'multi') {
      // For multi mode, we keep the SQLite schema as default but ensure both are available
      fs.copyFileSync(sqliteSchemaPath, schemaPath);
      console.log('Using SQLite schema for local development in multi-database mode');
    } else {
      console.error(`Invalid database mode: ${dbMode}. Use "sqlite", "postgres", or "multi".`);
      process.exit(1);
    }
    
    // Generate the Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log(`Successfully switched to ${dbMode} database mode`);
  } catch (error) {
    console.error('Error switching database mode:', error);
    process.exit(1);
  }
}

switchDb();
