// This script updates the database URL in the Prisma schema to use an absolute path
const fs = require('fs');
const path = require('path');

// Get the absolute path to the database file
const dbPath = path.join(__dirname, 'golden_rules.db');
console.log(`Database absolute path: ${dbPath}`);

// Check if the database file exists
const dbExists = fs.existsSync(dbPath);
console.log(`Database file exists: ${dbExists}`);

// Read the current schema
const schemaPath = path.join(__dirname, 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Update the database URL to use an absolute path
const updatedSchema = schema.replace(
  /url\s*=\s*"file:\.\/golden_rules\.db"/,
  `url = "file:${dbPath.replace(/\\/g, '\\\\')}"`
);

// Write the updated schema back to the file
fs.writeFileSync(schemaPath, updatedSchema);
console.log('Updated schema.prisma with absolute database path');

// Print the current working directory for reference
console.log(`Current working directory: ${process.cwd()}`);
