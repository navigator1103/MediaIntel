import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Path to the .env file
const envFilePath = path.join(process.cwd(), '.env');

// Content for the multi-database .env file
const multiDbEnvContent = `# Database URLs
DATABASE_URL="file:./prisma/dev.db"
POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/golden_rules"

# JWT Secret
JWT_SECRET=golden-rules-jwt-secret-for-local-dev

# Database Mode
# Options: sqlite, postgres, multi
DB_MODE=multi
`;

// Function to set up the multi-database configuration
async function setupMultiDb() {
  try {
    console.log('Setting up multi-database configuration...');
    
    // Backup the existing .env file if it exists
    if (fs.existsSync(envFilePath)) {
      const backupPath = `${envFilePath}.backup-${Date.now()}`;
      fs.copyFileSync(envFilePath, backupPath);
      console.log(`Backed up existing .env file to ${backupPath}`);
    }
    
    // Write the new .env file
    fs.writeFileSync(envFilePath, multiDbEnvContent);
    console.log('Created new .env file with multi-database configuration');
    
    // Create a PostgreSQL-specific Prisma schema
    const pgSchemaPath = path.join(process.cwd(), 'prisma', 'schema.postgres.prisma');
    
    // Read the existing schema
    const existingSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaContent = fs.readFileSync(existingSchemaPath, 'utf8');
    
    // Replace the datasource with PostgreSQL
    // Using a more compatible approach without the 's' flag
    const datasourceRegex = /datasource\s+db\s+{[\s\S]*?}/;
    schemaContent = schemaContent.replace(
      datasourceRegex,
      `datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}`
    );
    
    // Write the PostgreSQL schema
    fs.writeFileSync(pgSchemaPath, schemaContent);
    console.log('Created PostgreSQL-specific Prisma schema');
    
    // Create a script to update the Prisma client based on the active database
    const switchDbScriptPath = path.join(process.cwd(), 'scripts', 'switch-db.ts');
    const switchDbScriptContent = `import * as fs from 'fs';
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
    console.log(\`Switching to \${dbMode} database mode...\`);
    
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
      console.error(\`Invalid database mode: \${dbMode}. Use "sqlite", "postgres", or "multi".\`);
      process.exit(1);
    }
    
    // Generate the Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log(\`Successfully switched to \${dbMode} database mode\`);
  } catch (error) {
    console.error('Error switching database mode:', error);
    process.exit(1);
  }
}

switchDb();
`;
    
    fs.writeFileSync(switchDbScriptPath, switchDbScriptContent);
    console.log('Created database switching script');
    
    // Backup the current schema
    const sqliteSchemaPath = path.join(process.cwd(), 'prisma', 'schema.sqlite.prisma');
    fs.copyFileSync(existingSchemaPath, sqliteSchemaPath);
    console.log('Backed up SQLite schema');
    
    // Create a script to initialize the PostgreSQL database
    const initPgScriptPath = path.join(process.cwd(), 'scripts', 'init-postgres.ts');
    const initPgScriptContent = `import { execSync } from 'child_process';
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
`;
    
    fs.writeFileSync(initPgScriptPath, initPgScriptContent);
    console.log('Created PostgreSQL initialization script');
    
    // Add a script to package.json for easier execution
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add new scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'db:switch': 'ts-node scripts/switch-db.ts',
      'db:init-postgres': 'ts-node scripts/init-postgres.ts',
      'db:sync-pg-to-sqlite': 'ts-node scripts/sync-databases.ts pg-to-sqlite',
      'db:sync-sqlite-to-pg': 'ts-node scripts/sync-databases.ts sqlite-to-pg'
    };
    
    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json with new database scripts');
    
    console.log('\nMulti-database configuration set up successfully!');
    console.log('\nNext steps:');
    console.log('1. Install PostgreSQL if not already installed');
    console.log('2. Create a "golden_rules" database in PostgreSQL');
    console.log('3. Run "npm run db:init-postgres" to initialize the PostgreSQL database');
    console.log('4. Run "npm run db:sync-pg-to-sqlite" to sync data from PostgreSQL to SQLite');
    console.log('5. Run "npm run db:sync-sqlite-to-pg" to sync data from SQLite to PostgreSQL');
    
  } catch (error) {
    console.error('Error setting up multi-database configuration:', error);
    process.exit(1);
  }
}

setupMultiDb();
