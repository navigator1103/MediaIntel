import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Path to the .env file
const envFilePath = path.join(process.cwd(), '.env');

// Get the current username
const username = execSync('whoami').toString().trim();

// Read the current .env file
const envContent = fs.readFileSync(envFilePath, 'utf8');

// Update the PostgreSQL connection string to use the current username
const updatedEnvContent = envContent.replace(
  /POSTGRES_URL="postgresql:\/\/postgres:postgres@localhost:5432\/golden_rules"/,
  `POSTGRES_URL="postgresql://${username}@localhost:5432/golden_rules"`
);

// Write the updated .env file
fs.writeFileSync(envFilePath, updatedEnvContent);

console.log(`Updated PostgreSQL connection string to use username: ${username}`);
