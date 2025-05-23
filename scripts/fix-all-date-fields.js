const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the SQLite database
const dbPath = path.resolve(__dirname, '../prisma/golden_rules.db');

// Create a backup of the database
function createBackup() {
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  execSync(`cp "${dbPath}" "${backupPath}"`);
  console.log(`✅ Created backup at: ${backupPath}`);
  return backupPath;
}

// Get all tables in the database
function getAllTables() {
  const tablesOutput = execSync(`sqlite3 "${dbPath}" ".tables"`).toString();
  return tablesOutput.trim().split(/\s+/);
}

// Get all columns for a table
function getTableColumns(tableName) {
  const columnsOutput = execSync(`sqlite3 "${dbPath}" "PRAGMA table_info(${tableName})"`).toString();
  const columns = [];
  
  columnsOutput.split('\n').forEach(line => {
    if (!line.trim()) return;
    const parts = line.split('|');
    if (parts.length >= 3) {
      const columnName = parts[1];
      const columnType = parts[2];
      columns.push({ name: columnName, type: columnType });
    }
  });
  
  return columns;
}

// Fix date fields in a table
function fixDateFieldsInTable(tableName, dateColumns) {
  if (dateColumns.length === 0) return;
  
  console.log(`\nFixing date fields in table: ${tableName}`);
  console.log(`Date columns: ${dateColumns.map(col => col.name).join(', ')}`);
  
  for (const column of dateColumns) {
    // First, check if there are any problematic timestamp values
    const checkSql = `SELECT COUNT(*) FROM ${tableName} WHERE ${column.name} GLOB '*[0-9]*' AND NOT ${column.name} GLOB '*[^0-9]*'`;
    const timestampCount = parseInt(execSync(`sqlite3 "${dbPath}" "${checkSql}"`).toString().trim(), 10);
    
    if (timestampCount > 0) {
      console.log(`Found ${timestampCount} timestamp values in ${tableName}.${column.name}`);
      
      // Convert timestamps to ISO format
      const updateSql = `
        UPDATE ${tableName}
        SET ${column.name} = strftime('%Y-%m-%dT%H:%M:%S.000Z', CAST(${column.name} AS INTEGER) / 1000, 'unixepoch')
        WHERE ${column.name} GLOB '*[0-9]*' AND NOT ${column.name} GLOB '*[^0-9]*'
      `;
      execSync(`sqlite3 "${dbPath}" "${updateSql.replace(/\s+/g, ' ').trim()}"`);
      console.log(`✅ Converted ${timestampCount} timestamps in ${tableName}.${column.name}`);
    }
    
    // Fix any dates in YYYY-MM-DD HH:MM:SS format
    const checkSql2 = `SELECT COUNT(*) FROM ${tableName} WHERE ${column.name} GLOB '*-*-* *:*:*'`;
    const dateCount = parseInt(execSync(`sqlite3 "${dbPath}" "${checkSql2}"`).toString().trim(), 10);
    
    if (dateCount > 0) {
      console.log(`Found ${dateCount} date values in YYYY-MM-DD HH:MM:SS format in ${tableName}.${column.name}`);
      
      // Convert to ISO format
      const updateSql2 = `
        UPDATE ${tableName}
        SET ${column.name} = strftime('%Y-%m-%dT%H:%M:%S.000Z', ${column.name})
        WHERE ${column.name} GLOB '*-*-* *:*:*'
      `;
      execSync(`sqlite3 "${dbPath}" "${updateSql2.replace(/\s+/g, ' ').trim()}"`);
      console.log(`✅ Converted ${dateCount} dates in ${tableName}.${column.name}`);
    }
    
    // Add Z suffix to any ISO dates without it
    const checkSql3 = `SELECT COUNT(*) FROM ${tableName} WHERE ${column.name} GLOB '*-*-*T*:*:*' AND NOT ${column.name} GLOB '*Z'`;
    const isoCount = parseInt(execSync(`sqlite3 "${dbPath}" "${checkSql3}"`).toString().trim(), 10);
    
    if (isoCount > 0) {
      console.log(`Found ${isoCount} ISO dates without Z suffix in ${tableName}.${column.name}`);
      
      // Add Z suffix
      const updateSql3 = `
        UPDATE ${tableName}
        SET ${column.name} = ${column.name} || 'Z'
        WHERE ${column.name} GLOB '*-*-*T*:*:*' AND NOT ${column.name} GLOB '*Z'
      `;
      execSync(`sqlite3 "${dbPath}" "${updateSql3.replace(/\s+/g, ' ').trim()}"`);
      console.log(`✅ Added Z suffix to ${isoCount} dates in ${tableName}.${column.name}`);
    }
  }
}

// Main function
async function fixAllDateFields() {
  console.log('Starting to fix all date fields in the database...');
  
  try {
    // Create a backup first
    const backupPath = createBackup();
    
    // Get all tables
    const tables = getAllTables();
    console.log(`Found ${tables.length} tables in the database: ${tables.join(', ')}`);
    
    // Process each table
    for (const table of tables) {
      const columns = getTableColumns(table);
      
      // Find date columns (TEXT type with date-related names)
      const dateColumns = columns.filter(col => {
        return col.type.toUpperCase() === 'TEXT' && 
               (col.name.includes('date') || 
                col.name.includes('_at') || 
                col.name.includes('_time'));
      });
      
      if (dateColumns.length > 0) {
        fixDateFieldsInTable(table, dateColumns);
      }
    }
    
    console.log('\n✅ All date fields have been processed.');
    
    // Verify the database is now readable
    try {
      const testQuery = `SELECT COUNT(*) FROM game_plans`;
      const count = execSync(`sqlite3 "${dbPath}" "${testQuery}"`).toString().trim();
      console.log(`\nVerification: Found ${count} records in game_plans table.`);
      console.log('Database is readable and date formats have been fixed.');
    } catch (error) {
      console.error('Error verifying database:', error);
    }
    
  } catch (error) {
    console.error('Error fixing date fields:', error);
    process.exit(1);
  }
}

// Run the script
fixAllDateFields()
  .catch(console.error)
  .finally(() => console.log('\nScript completed.'));
