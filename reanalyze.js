const XLSX = require('xlsx');

console.log('Re-analyzing Diminishing Returns Structure...\n');

try {
  const workbook = XLSX.readFile('public/templates/ABP2026_Game_Plans_Template-file (1).xlsx');
  
  console.log('=== TV Diminishing Returns - Detailed Analysis ===');
  const tvSheet = workbook.Sheets['TV Diminishing Return'];
  if (tvSheet) {
    const tvData = XLSX.utils.sheet_to_json(tvSheet, { header: 1, defval: '' });
    
    // Show structure more clearly
    console.log('Headers and structure:');
    for (let i = 0; i < 10; i++) {
      if (tvData[i] && tvData[i].some(cell => cell !== '')) {
        console.log(`Row ${i + 1}:`, JSON.stringify(tvData[i].slice(0, 20)));
      }
    }
  }
  
  console.log('\n=== Digital Diminishing Returns - Detailed Analysis ===');
  const digitalSheet = workbook.Sheets['Digital Diminishing Return'];
  if (digitalSheet) {
    const digitalData = XLSX.utils.sheet_to_json(digitalSheet, { header: 1, defval: '' });
    
    // Show structure more clearly  
    console.log('Headers and structure:');
    for (let i = 0; i < 10; i++) {
      if (digitalData[i] && digitalData[i].some(cell => cell !== '')) {
        console.log(`Row ${i + 1}:`, JSON.stringify(digitalData[i].slice(0, 20)));
      }
    }
    
    console.log('\nColumn mapping analysis:');
    console.log('Row 2 (Audience Headers):', JSON.stringify(digitalData[1] ? digitalData[1].slice(10, 15) : []));
    console.log('Row 3 (Field Headers):', JSON.stringify(digitalData[2] ? digitalData[2].slice(0, 15) : []));
    
    // Show how data is actually structured
    console.log('\nData rows with reach values:');
    for (let i = 3; i < 8; i++) {
      if (digitalData[i]) {
        const row = digitalData[i];
        console.log(`Row ${i + 1} Structure:`);
        console.log('  Budget:', row[8]);
        console.log('  Frequency:', row[9]);  
        console.log('  F 18-45 Reach:', row[10]);
        console.log('  M 20-60 Reach:', row[11]);
        console.log('  BG 18-45 Reach:', row[12]);
      }
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
}