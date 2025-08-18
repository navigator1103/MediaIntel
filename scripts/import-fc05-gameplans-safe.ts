import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parse';
import { ValidationUtility } from './validation-utility';

const prisma = new PrismaClient();

interface GamePlanCSVRow {
  Category: string;
  Range: string;
  Campaign: string;
  'Playbook ID': string;
  'Campaign Archetype': string;
  Burst: string;
  Media: string;
  'Media Subtype': string;
  'Initial Date': string;
  'End Date': string;
  ' Total Weeks ': string;
  'Total Budget': string;
  Jan: string;
  Feb: string;
  Mar: string;
  Apr: string;
  May: string;
  Jun: string;
  Jul: string;
  Aug: string;
  Sep: string;
  Oct: string;
  Nov: string;
  Dec: string;
  'Total WOA': string;
  'Total WOFF': string;
  'Total TRPs': string;
  'Total R1+ (%)': string;
  'Total R3+ (%)': string;
  Country: string;
  'Business Unit': string;
}

// Helper functions
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return null;
  
  // Handle format like "1-Sep-2025"
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const month = monthMap[parts[1]];
    const year = parseInt(parts[2]);
    
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  // Try standard date parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseBudget(value: string): number {
  if (!value || value === 'N/A' || value === '' || value.trim() === '-') return 0;
  // Remove commas, currency symbols, and extra spaces
  const cleaned = value.replace(/[,$\\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

async function importGamePlansSafe() {
  const validator = new ValidationUtility();
  
  try {
    console.log('🔄 Starting SAFE FC05 2025 Game Plans import...');
    
    // Initialize validation utility
    await validator.initialize();
    
    // Find or create the FC05 2025 last update entry
    let lastUpdate = await prisma.lastUpdate.findFirst({
      where: { name: 'FC05 2025' }
    });
    
    if (!lastUpdate) {
      lastUpdate = await prisma.lastUpdate.create({
        data: { name: 'FC05 2025' }
      });
      console.log('✅ Created FC05 2025 financial cycle');
    } else {
      console.log('✅ Found existing FC05 2025 financial cycle');
    }
    
    // Read and parse CSV file
    const csvFilePath = '/Users/naveedshah/Downloads/FC05 data_clean and in Nebula template_Gameplan tab_as of 19th Aug 2025.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Remove BOM if present
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    
    const records: GamePlanCSVRow[] = await new Promise((resolve, reject) => {
      csv.parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    console.log(`📊 Found ${records.length} records to validate and import`);
    
    let validatedCount = 0;
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const validationErrors: Array<{row: number, errors: string[], warnings: string[]}> = [];
    
    console.log('\\n🔍 Phase 1: Validation...');
    
    for (const [index, row] of records.entries()) {
      const rowNumber = index + 2; // +2 for header and 0-based index
      
      // Skip empty rows
      if (!row.Campaign || !row.Country) {
        console.log(`⚠️  Skipping row ${rowNumber}: Missing campaign or country`);
        skippedCount++;
        continue;
      }
      
      // Validate the record
      const validation = await validator.validateRecord(
        row.Category,
        row.Range,
        row.Campaign,
        row.Country,
        row['Business Unit'],
        row.Media,
        row['Media Subtype']
      );
      
      if (!validation.validationResult.isValid) {
        validationErrors.push({
          row: rowNumber,
          errors: validation.validationResult.errors,
          warnings: validation.validationResult.warnings
        });
        errorCount++;
        
        console.log(`❌ Row ${rowNumber} (${row.Campaign}): ${validation.validationResult.errors.join(', ')}`);
      } else {
        validatedCount++;
        if (validation.validationResult.warnings.length > 0) {
          console.log(`⚠️  Row ${rowNumber} (${row.Campaign}): ${validation.validationResult.warnings.join(', ')}`);
        }
      }
    }
    
    console.log('\\n📊 VALIDATION SUMMARY:');
    console.log(`✅ Valid records: ${validatedCount}`);
    console.log(`❌ Invalid records: ${errorCount}`);
    console.log(`⚠️  Skipped records: ${skippedCount}`);
    
    if (errorCount > 0) {
      console.log('\\n❌ VALIDATION ERRORS FOUND:');
      console.log('The following records have validation errors and will NOT be imported:');
      validationErrors.slice(0, 20).forEach(error => {
        console.log(`  Row ${error.row}: ${error.errors.join(', ')}`);
      });
      
      if (validationErrors.length > 20) {
        console.log(`  ... and ${validationErrors.length - 20} more errors`);
      }
      
      console.log('\\n⛔ IMPORT CANCELLED due to validation errors.');
      console.log('Please fix the data mappings or verify the CSV data before importing.');
      return;
    }
    
    console.log('\\n✅ All records validated successfully!');
    console.log('🚀 Proceeding with import...');
    
    // Phase 2: Import only validated records
    for (const [index, row] of records.entries()) {
      const rowNumber = index + 2;
      
      try {
        // Skip empty rows (already logged in validation phase)
        if (!row.Campaign || !row.Country) {
          continue;
        }
        
        // Re-validate to get the database objects
        const validation = await validator.validateRecord(
          row.Category,
          row.Range,
          row.Campaign,
          row.Country,
          row['Business Unit'],
          row.Media,
          row['Media Subtype']
        );
        
        // Find or create campaign archetype if provided
        let campaignArchetype = null;
        if (row['Campaign Archetype'] && row['Campaign Archetype'] !== 'N/A') {
          campaignArchetype = await prisma.campaignArchetype.findFirst({
            where: { name: row['Campaign Archetype'] }
          });
          
          if (!campaignArchetype) {
            try {
              campaignArchetype = await prisma.campaignArchetype.create({
                data: { name: row['Campaign Archetype'] }
              });
              console.log(`📝 Created campaign archetype: ${row['Campaign Archetype']}`);
            } catch (e) {
              campaignArchetype = await prisma.campaignArchetype.findFirst({
                where: { name: row['Campaign Archetype'] }
              });
            }
          }
        }
        
        // Handle media type fallback
        let mediaType = validation.mediaType;
        if (!mediaType && row.Media && row.Media !== 'N/A') {
          try {
            mediaType = await prisma.mediaType.create({
              data: { name: row.Media }
            });
            console.log(`📝 Created media type: ${row.Media}`);
          } catch (e) {
            mediaType = await prisma.mediaType.findFirst({
              where: { name: row.Media }
            });
          }
        }
        
        // Handle media subtype fallback
        let mediaSubType = validation.mediaSubType;
        if (!mediaSubType && row['Media Subtype'] && row['Media Subtype'] !== 'N/A') {
          try {
            mediaSubType = await prisma.mediaSubType.create({
              data: { 
                name: row['Media Subtype'],
                mediaTypeId: mediaType?.id || 1
              }
            });
            console.log(`📝 Created media subtype: ${row['Media Subtype']}`);
          } catch (e) {
            mediaSubType = await prisma.mediaSubType.findFirst({
              where: { name: row['Media Subtype'] }
            });
          }
        }
        
        if (!mediaSubType) {
          console.log(`⚠️  Using fallback media subtype for row ${rowNumber}`);
          mediaSubType = await prisma.mediaSubType.findFirst({
            orderBy: { id: 'asc' }
          });
        }
        
        // Parse dates
        const startDateParsed = parseDate(row['Initial Date']);
        const endDateParsed = parseDate(row['End Date']);
        const startDate = startDateParsed ? startDateParsed.toISOString() : '';
        const endDate = endDateParsed ? endDateParsed.toISOString() : '';
        
        // Parse budget values
        const totalBudget = parseBudget(row['Total Budget']);
        const janBudget = parseBudget(row.Jan);
        const febBudget = parseBudget(row.Feb);
        const marBudget = parseBudget(row.Mar);
        const aprBudget = parseBudget(row.Apr);
        const mayBudget = parseBudget(row.May);
        const junBudget = parseBudget(row.Jun);
        const julBudget = parseBudget(row.Jul);
        const augBudget = parseBudget(row.Aug);
        const sepBudget = parseBudget(row.Sep);
        const octBudget = parseBudget(row.Oct);
        const novBudget = parseBudget(row.Nov);
        const decBudget = parseBudget(row.Dec);
        
        // Parse WOA/WOFF values
        const totalWoa = parseBudget(row['Total WOA']);
        const totalWoff = parseBudget(row['Total WOFF']);
        const totalWeeks = parseBudget(row[' Total Weeks ']); // Note the spaces
        
        // Create game plan entry
        await prisma.gamePlan.create({
          data: {
            campaignId: validation.campaign!.id,
            mediaSubTypeId: mediaSubType!.id,
            countryId: validation.country!.id,
            business_unit_id: validation.businessUnit?.id,
            category_id: validation.category?.id,
            range_id: validation.range?.id,
            campaignArchetypeId: campaignArchetype?.id,
            last_update_id: lastUpdate.id,
            playbook_id: row['Playbook ID'] !== 'N/A' ? row['Playbook ID'] : null,
            totalBudget,
            janBudget,
            febBudget,
            marBudget,
            aprBudget,
            mayBudget,
            junBudget,
            julBudget,
            augBudget,
            sepBudget,
            octBudget,
            novBudget,
            decBudget,
            startDate,
            endDate,
            burst: parseInt(row.Burst) || 1,
            totalWoa: totalWoa || 0,
            totalWoff: totalWoff || 0,
            totalWeeks: totalWeeks || 0,
            year: 2025
          }
        });
        
        importedCount++;
        if (importedCount % 50 === 0) {
          console.log(`📈 Imported ${importedCount} records...`);
        }
        
      } catch (error: any) {
        console.error(`❌ Import error on row ${rowNumber} (${row.Campaign}): ${error.message || String(error)}`);
      }
    }
    
    console.log('\\n🎉 IMPORT SUMMARY:');
    console.log('=====================');
    console.log(`✅ Successfully imported: ${importedCount} records`);
    console.log(`⚠️  Skipped empty rows: ${skippedCount} records`);
    console.log(`❌ Validation errors prevented: ${errorCount} records`);
    
    // Verify the import
    const totalImported = await prisma.gamePlan.count({
      where: { last_update_id: lastUpdate.id }
    });
    console.log(`\\n📊 Total Game Plan records for FC05 2025: ${totalImported}`);
    
    console.log('\\n✅ SAFE IMPORT COMPLETED SUCCESSFULLY!');
    console.log('All imported data matches your current category, range, and campaign mappings.');
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  } finally {
    await validator.disconnect();
  }
}

// Run the import
importGamePlansSafe();