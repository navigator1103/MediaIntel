const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { execSync } = require('child_process');

async function fixDates() {
  console.log('Starting to fix date formats in SQLite database...');
  
  try {
    // Get the path to the SQLite database
    const dbPath = path.resolve(__dirname, '../prisma/golden_rules.db');
    
    // First, let's check the current state of the game_plans table
    console.log('Current game_plans table structure:');
    const tableInfo = execSync(`sqlite3 "${dbPath}" ".schema game_plans"`).toString();
    console.log(tableInfo);
    
    // Create a backup of the database first
    const backupPath = `${dbPath}.backup-${Date.now()}`;
    execSync(`cp "${dbPath}" "${backupPath}"`);
    console.log(`\n✅ Created backup at: ${backupPath}`);
    
    // Now fix the dates in the game_plans table
    console.log('\nFixing date formats in game_plans table...');
    
    // First, let's check if we need to create a backup of the current state
    console.log('Creating backup of current data...');
    const backupData = execSync(`sqlite3 "${dbPath}" "SELECT id, start_date, end_date FROM game_plans;"`).toString();
    const backupFile = `${dbPath}.pre-update-backup-${Date.now()}.sql`;
    require('fs').writeFileSync(backupFile, backupData);
    console.log(`✅ Created data backup at: ${backupFile}`);

    // SQL statements to update timestamps in all date columns to ISO 8601 format
    const updateStatements = [
      // First, convert start_date and end_date to standardized format
      `UPDATE game_plans
       SET start_date = CASE
         WHEN start_date GLOB '*[0-9]*' AND NOT start_date GLOB '*[^0-9]*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', CAST(start_date AS INTEGER) / 1000, 'unixepoch')
         WHEN start_date GLOB '*-*-* *:*:*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', start_date)
         WHEN start_date GLOB '*-*-*T*:*:*' AND NOT start_date GLOB '*Z' THEN
           start_date || 'Z'
         ELSE
           start_date
       END
       WHERE start_date IS NOT NULL AND start_date != ''`,
      
      `UPDATE game_plans
       SET end_date = CASE
         WHEN end_date GLOB '*[0-9]*' AND NOT end_date GLOB '*[^0-9]*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', CAST(end_date AS INTEGER) / 1000, 'unixepoch')
         WHEN end_date GLOB '*-*-* *:*:*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', end_date)
         WHEN end_date GLOB '*-*-*T*:*:*' AND NOT end_date GLOB '*Z' THEN
           end_date || 'Z'
         ELSE
           end_date
       END
       WHERE end_date IS NOT NULL AND end_date != ''`,
      
      // Now handle created_at and updated_at fields
      `UPDATE game_plans
       SET created_at = CASE
         WHEN created_at GLOB '*[0-9]*' AND NOT created_at GLOB '*[^0-9]*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', CAST(created_at AS INTEGER) / 1000, 'unixepoch')
         WHEN created_at GLOB '*-*-* *:*:*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', created_at)
         WHEN created_at GLOB '*-*-*T*:*:*' AND NOT created_at GLOB '*Z' THEN
           created_at || 'Z'
         ELSE
           created_at
       END
       WHERE created_at IS NOT NULL AND created_at != ''`,
      
      `UPDATE game_plans
       SET updated_at = CASE
         WHEN updated_at GLOB '*[0-9]*' AND NOT updated_at GLOB '*[^0-9]*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', CAST(updated_at AS INTEGER) / 1000, 'unixepoch')
         WHEN updated_at GLOB '*-*-* *:*:*' THEN
           strftime('%Y-%m-%dT%H:%M:%S.000Z', updated_at)
         WHEN updated_at GLOB '*-*-*T*:*:*' AND NOT updated_at GLOB '*Z' THEN
           updated_at || 'Z'
         ELSE
           updated_at
       END
       WHERE updated_at IS NOT NULL AND updated_at != ''`,
      
      // Ensure all dates have the proper format with Z suffix
      `UPDATE game_plans
       SET start_date = REPLACE(start_date, ' ', 'T') || CASE WHEN start_date NOT GLOB '*Z' THEN '.000Z' ELSE '' END
       WHERE start_date IS NOT NULL AND start_date != '' AND start_date NOT GLOB '*-*-*T*:*:*.*Z'`,
      
      `UPDATE game_plans
       SET end_date = REPLACE(end_date, ' ', 'T') || CASE WHEN end_date NOT GLOB '*Z' THEN '.000Z' ELSE '' END
       WHERE end_date IS NOT NULL AND end_date != '' AND end_date NOT GLOB '*-*-*T*:*:*.*Z'`,
      
      `UPDATE game_plans
       SET created_at = REPLACE(created_at, ' ', 'T') || CASE WHEN created_at NOT GLOB '*Z' THEN '.000Z' ELSE '' END
       WHERE created_at IS NOT NULL AND created_at != '' AND created_at NOT GLOB '*-*-*T*:*:*.*Z'`,
      
      `UPDATE game_plans
       SET updated_at = REPLACE(updated_at, ' ', 'T') || CASE WHEN updated_at NOT GLOB '*Z' THEN '.000Z' ELSE '' END
       WHERE updated_at IS NOT NULL AND updated_at != '' AND updated_at NOT GLOB '*-*-*T*:*:*.*Z'`
    ];
    
    // Execute each statement separately
    for (const [index, sql] of updateStatements.entries()) {
      console.log(`\nExecuting update ${index + 1}/${updateStatements.length}...`);
      console.log(sql);
      execSync(`sqlite3 "${dbPath}" "${sql.replace(/\n\s*/g, ' ').trim()}"`);
      console.log('✅ Update completed');
    }
    
    console.log('✅ All date format updates completed.');
    
    // Verify the changes
    console.log('\nVerifying date formats...');
    const sampleRecords = execSync(`sqlite3 -header -column "${dbPath}" "
      SELECT 
        id, 
        start_date, 
        end_date,
        CASE 
          WHEN start_date GLOB '*-*-*T*:*:*Z' THEN 'Valid ISO format' 
          ELSE 'Invalid format' 
        END as start_date_status,
        CASE 
          WHEN end_date GLOB '*-*-*T*:*:*Z' THEN 'Valid ISO format' 
          ELSE 'Invalid format' 
        END as end_date_status
      FROM game_plans 
      LIMIT 10;
    "`).toString();
    
    console.log('Sample of updated records:');
    console.log(sampleRecords);
    
    // Count of records with invalid formats
    const invalidCount = execSync(`sqlite3 "${dbPath}" "
      SELECT COUNT(*) as invalid_count 
      FROM game_plans 
      WHERE start_date NOT GLOB '*-*-*T*:*:*Z' 
         OR end_date NOT GLOB '*-*-*T*:*:*Z';
    "`).toString().trim();
    
    console.log(`\nRecords with invalid date formats: ${invalidCount}`);
    
  } catch (error) {
    console.error('Error fixing dates:', error);
    process.exit(1);
  }
}

// Run the script
fixDates()
  .catch(console.error)
  .finally(() => console.log('\nScript completed.'));
