import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Path to the .env file
const envFilePath = path.join(process.cwd(), '.env');

// Read the current .env file
const envContent = fs.readFileSync(envFilePath, 'utf8');

// Update the DB_MODE to sqlite
const updatedEnvContent = envContent.replace(
  /DB_MODE=multi/,
  'DB_MODE=sqlite'
);

// Write the updated .env file
fs.writeFileSync(envFilePath, updatedEnvContent);

console.log('Reset database mode to SQLite');

// Ensure we're using the SQLite schema
const sqliteSchemaPath = path.join(process.cwd(), 'prisma', 'schema.sqlite.prisma');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (fs.existsSync(sqliteSchemaPath)) {
  fs.copyFileSync(sqliteSchemaPath, schemaPath);
  console.log('Restored SQLite schema');
} else {
  console.log('No SQLite schema backup found, current schema is unchanged');
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Successfully reset to SQLite mode');
} catch (error) {
  console.error('Error generating Prisma client:', error);
}
