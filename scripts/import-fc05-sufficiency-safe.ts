import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parse';
import { ValidationUtility } from './validation-utility';

const prisma = new PrismaClient();

interface SufficiencyCSVRow {
  Category: string;
  Range: string;
  Campaign: string;
  'TV Demo Gender': string;
  'TV Demo Min. Age': string;
  'TV Demo Max. Age': string;
  'TV SEL': string;
  'Final TV Target (don\'t fill)': string;
  'TV Target Size': string;
  'TV Copy Length': string;
  'Total TV Planned R1+ (%)': string;
  'Total TV Planned R3+ (%)': string;
  'TV Optimal R1+': string;
  'CPP 2024': string;
  'CPP 2025': string;
  'CPP 2026': string;
  'Reported Currency': string;
  'Is Digital target the same than TV?': string;
  'Digital Demo Gender': string;
  'Digital Demo Min. Age': string;
  'Digital Demo Max. Age': string;
  'Digital SEL': string;
  'Final Digital Target (don\'t fill)': string;
  'Digital Target Size (Abs)': string;
  'Total Digital Planned R1+': string;
  'Total Digital Optimal R1+': string;
  'Planned Combined Reach (Don\'t fill)': string;
  'Combined Potential Reach': string;
  Country: string;
  'Business Unit': string;
}

// Helper functions
function parseNumber(value: string): number | null {
  if (!value || value === 'N/A' || value.trim() === '' || value.trim() === '-') return null;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function parsePercentage(value: string): string | null {
  if (!value || value === 'N/A' || value.trim() === '' || value.trim() === '-') return null;
  return value.replace('%', '').trim();
}

function parseBoolean(value: string): boolean | null {
  if (!value || value === 'N/A' || value.trim() === '') return null;
  const lower = value.toLowerCase().trim();
  if (lower === 'yes' || lower === 'true' || lower === '1') return true;
  if (lower === 'no' || lower === 'false' || lower === '0') return false;
  return null;
}

async function importMediaSufficiencySafe() {
  const validator = new ValidationUtility();
  
  try {
    console.log('🔄 Starting SAFE FC05 2025 Media Sufficiency import...');
    
    // Initialize validation utility
    await validator.initialize();
    
    // Get the FC05 2025 last update entry
    const lastUpdate = await prisma.lastUpdate.findFirst({
      where: { name: 'FC05 2025' }
    });
    
    if (!lastUpdate) {
      console.error('❌ FC05 2025 financial cycle not found. Please run game plans import first.');
      return;
    }
    
    console.log('✅ Found FC05 2025 financial cycle with ID:', lastUpdate.id);
    
    // Read and parse CSV file
    const csvFilePath = '/Users/naveedshah/Downloads/FC05 data_clean and in Nebula template_Sufficiency tab_as of 19th Aug 2025.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Remove BOM if present
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    
    // Parse CSV
    const records = await new Promise<SufficiencyCSVRow[]>((resolve, reject) => {
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
        row['Business Unit']
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
          row['Business Unit']
        );
        
        // Parse numeric fields
        const tvDemoMinAge = parseNumber(row['TV Demo Min. Age']);
        const tvDemoMaxAge = parseNumber(row['TV Demo Max. Age']);
        const digitalDemoMinAge = parseNumber(row['Digital Demo Min. Age']);
        const digitalDemoMaxAge = parseNumber(row['Digital Demo Max. Age']);
        const cpp2024 = parseNumber(row['CPP 2024']);
        const cpp2025 = parseNumber(row['CPP 2025']);
        const cpp2026 = parseNumber(row['CPP 2026']);
        
        // Parse percentage fields
        const tvPlannedR1Plus = parsePercentage(row['Total TV Planned R1+ (%)']);
        const tvPlannedR3Plus = parsePercentage(row['Total TV Planned R3+ (%)']);
        const tvPotentialR1Plus = parsePercentage(row['TV Optimal R1+']);
        const digitalPlannedR1Plus = parsePercentage(row['Total Digital Planned R1+']);
        const digitalPotentialR1Plus = parsePercentage(row['Total Digital Optimal R1+']);
        const plannedCombinedReach = parsePercentage(row['Planned Combined Reach (Don\\'t fill)']);
        const combinedPotentialReach = parsePercentage(row['Combined Potential Reach']);
        
        // Parse boolean field
        const isDigitalTargetSameAsTv = parseBoolean(row['Is Digital target the same than TV?']);
        
        // Create media sufficiency entry
        await prisma.mediaSufficiency.create({
          data: {
            lastUpdate: 'FC05 2025',
            lastUpdateId: lastUpdate.id,
            country: row.Country,
            countryId: validation.country?.id,
            bu: row['Business Unit'] !== 'N/A' ? row['Business Unit'] : null,
            buId: validation.businessUnit?.id,
            category: row.Category !== 'N/A' ? row.Category : null,
            categoryId: validation.category?.id,
            range: row.Range !== 'N/A' ? row.Range : null,
            rangeId: validation.range?.id,
            campaign: row.Campaign,
            campaignId: validation.campaign?.id,
            // TV Demographics & Targeting
            tvDemoGender: row['TV Demo Gender'] !== 'N/A' ? row['TV Demo Gender'] : null,
            tvDemoMinAge,
            tvDemoMaxAge,
            tvSel: row['TV SEL'] !== 'N/A' ? row['TV SEL'] : null,
            finalTvTarget: row['Final TV Target (don\\'t fill)'] !== 'N/A' ? row['Final TV Target (don\\'t fill)'] : null,
            tvTargetSize: row['TV Target Size'] !== 'N/A' ? row['TV Target Size'] : null,
            tvCopyLength: row['TV Copy Length'] !== 'N/A' ? row['TV Copy Length'] : null,
            // TV Performance Metrics
            tvPlannedR1Plus,
            tvPlannedR3Plus,
            tvPotentialR1Plus,
            cpp2024,
            cpp2025,
            cpp2026,
            reportedCurrency: row['Reported Currency'] !== 'N/A' ? row['Reported Currency'] : null,
            // Digital Demographics & Targeting
            isDigitalTargetSameAsTv,
            digitalDemoGender: row['Digital Demo Gender'] !== 'N/A' ? row['Digital Demo Gender'] : null,
            digitalDemoMinAge,
            digitalDemoMaxAge,
            digitalSel: row['Digital SEL'] !== 'N/A' ? row['Digital SEL'] : null,
            finalDigitalTarget: row['Final Digital Target (don\\'t fill)'] !== 'N/A' ? row['Final Digital Target (don\\'t fill)'] : null,
            digitalTargetSizeAbs: row['Digital Target Size (Abs)'] !== 'N/A' ? row['Digital Target Size (Abs)'] : null,
            // Digital Performance Metrics
            digitalPlannedR1Plus,
            digitalPotentialR1Plus,
            // Combined Metrics
            plannedCombinedReach,
            combinedPotentialReach,
            // System Fields
            uploadedBy: 'FC05 Safe Import Script',
            uploadSession: `fc05-safe-import-${new Date().toISOString()}`
          }
        });
        
        importedCount++;
        if (importedCount % 20 === 0) {
          console.log(`📈 Imported ${importedCount} records...`);
        }
        
      } catch (error) {
        console.error(`❌ Import error on row ${rowNumber} (${row.Campaign}): ${error}`);
      }
    }
    
    console.log('\\n🎉 IMPORT SUMMARY:');
    console.log('=====================');
    console.log(`✅ Successfully imported: ${importedCount} records`);
    console.log(`⚠️  Skipped empty rows: ${skippedCount} records`);
    console.log(`❌ Validation errors prevented: ${errorCount} records`);
    
    // Verify the import
    const totalImported = await prisma.mediaSufficiency.count({
      where: { lastUpdateId: lastUpdate.id }
    });
    console.log(`\\n📊 Total Media Sufficiency records for FC05 2025: ${totalImported}`);
    
    console.log('\\n✅ SAFE IMPORT COMPLETED SUCCESSFULLY!');
    console.log('All imported data matches your current category, range, and campaign mappings.');
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  } finally {
    await validator.disconnect();
  }
}

// Run the import
importMediaSufficiencySafe();