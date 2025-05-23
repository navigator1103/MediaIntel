const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the SQLite database
const dbPath = path.resolve(__dirname, '../prisma/golden_rules.db');

// Function to check date formats in the database
function checkDateFormats() {
  console.log('Checking date formats in the database...');
  
  try {
    // Query to check for any numeric timestamps in start_date or end_date
    const checkSql = `
      SELECT COUNT(*) as count FROM game_plans 
      WHERE start_date GLOB '*[0-9]*' AND NOT start_date GLOB '*-*-*'
      OR end_date GLOB '*[0-9]*' AND NOT end_date GLOB '*-*-*'
    `;
    
    const result = execSync(`sqlite3 "${dbPath}" "${checkSql}"`).toString().trim();
    const count = parseInt(result, 10);
    
    if (count > 0) {
      console.log(`❌ Found ${count} records with invalid date formats (raw timestamps)`);
      
      // Get details of the problematic records
      const detailsSql = `
        SELECT id, start_date, end_date FROM game_plans
        WHERE start_date GLOB '*[0-9]*' AND NOT start_date GLOB '*-*-*'
        OR end_date GLOB '*[0-9]*' AND NOT end_date GLOB '*-*-*'
        LIMIT 5
      `;
      
      const details = execSync(`sqlite3 -header -column "${dbPath}" "${detailsSql}"`).toString();
      console.log('Sample problematic records:');
      console.log(details);
    } else {
      console.log('✅ All dates are properly formatted as ISO strings');
      
      // Show some sample records
      const sampleSql = `
        SELECT id, start_date, end_date FROM game_plans
        ORDER BY id DESC
        LIMIT 5
      `;
      
      const samples = execSync(`sqlite3 -header -column "${dbPath}" "${sampleSql}"`).toString();
      console.log('Sample records:');
      console.log(samples);
    }
    
    // Check for any records without Z suffix
    const checkZSql = `
      SELECT COUNT(*) as count FROM game_plans 
      WHERE start_date NOT GLOB '*Z' OR end_date NOT GLOB '*Z'
    `;
    
    const zResult = execSync(`sqlite3 "${dbPath}" "${checkZSql}"`).toString().trim();
    const zCount = parseInt(zResult, 10);
    
    if (zCount > 0) {
      console.log(`❌ Found ${zCount} records without Z suffix in dates`);
    } else {
      console.log('✅ All dates have proper Z suffix');
    }
    
  } catch (error) {
    console.error('Error checking date formats:', error);
  }
}

// Main function
async function main() {
  console.log('Starting import test...');
  
  // First, check current date formats
  console.log('\n--- BEFORE IMPORT ---');
  checkDateFormats();
  
  // Create a backup of the database
  const backupPath = `${dbPath}.test-backup-${Date.now()}`;
  execSync(`cp "${dbPath}" "${backupPath}"`);
  console.log(`\n✅ Created backup at: ${backupPath}`);
  
  // Now run our fix script to ensure all dates are properly formatted
  console.log('\nRunning fix-all-date-fields.js to ensure clean state...');
  execSync('node scripts/fix-all-date-fields.js');
  
  console.log('\n--- AFTER FIX ---');
  checkDateFormats();
  
  console.log('\nTest completed. Please manually import data through the UI to verify that dates are properly formatted.');
  console.log('After importing, run this script again to check if any date format issues were introduced.');
}

// Run the script
main()
  .catch(console.error)
  .finally(() => console.log('\nScript completed.'));
