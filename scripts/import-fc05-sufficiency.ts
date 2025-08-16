import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parse';

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

// Helper function to parse numeric values
function parseNumber(value: string): number | null {
  if (!value || value === 'N/A' || value.trim() === '' || value.trim() === '-') return null;
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Helper function to parse percentage values (keep as string for now)
function parsePercentage(value: string): string | null {
  if (!value || value === 'N/A' || value.trim() === '' || value.trim() === '-') return null;
  // Remove % sign if present but keep the number as string
  return value.replace('%', '').trim();
}

// Helper function to parse boolean values
function parseBoolean(value: string): boolean | null {
  if (!value || value === 'N/A' || value.trim() === '') return null;
  const lower = value.toLowerCase().trim();
  if (lower === 'yes' || lower === 'true' || lower === '1') return true;
  if (lower === 'no' || lower === 'false' || lower === '0') return false;
  return null;
}

async function importMediaSufficiency() {
  try {
    console.log('Starting FC05 2025 Media Sufficiency import...');
    
    // Get the FC05 2025 last update entry
    const lastUpdate = await prisma.lastUpdate.findFirst({
      where: { name: 'FC05 2025' }
    });
    
    if (!lastUpdate) {
      console.error('FC05 2025 financial cycle not found. Please run game plans import first.');
      return;
    }
    
    console.log('Found FC05 2025 financial cycle with ID:', lastUpdate.id);
    
    // Read and parse CSV file
    const csvFilePath = '/Users/naveedshah/Downloads/FC05 data_clean and in Nebula template_Sufficiency tab.csv';
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
    
    console.log(`Found ${records.length} records to import`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Create a map to cache lookups
    const countryCache = new Map<string, any>();
    const businessUnitCache = new Map<string, any>();
    const categoryCache = new Map<string, any>();
    const rangeCache = new Map<string, any>();
    const campaignCache = new Map<string, any>();
    
    for (const [index, row] of records.entries()) {
      try {
        // Skip empty rows
        if (!row.Campaign || !row.Country) {
          console.log(`Skipping row ${index + 2}: Missing campaign or country`);
          continue;
        }
        
        // Find country (with caching)
        let country = countryCache.get(row.Country);
        if (!country) {
          country = await prisma.country.findFirst({
            where: { name: row.Country }
          });
          if (country) {
            countryCache.set(row.Country, country);
          }
        }
        
        // Find business unit (with caching)
        let businessUnit = null;
        if (row['Business Unit'] && row['Business Unit'] !== 'N/A') {
          businessUnit = businessUnitCache.get(row['Business Unit']);
          if (!businessUnit) {
            businessUnit = await prisma.businessUnit.findFirst({
              where: { name: row['Business Unit'] }
            });
            if (businessUnit) {
              businessUnitCache.set(row['Business Unit'], businessUnit);
            }
          }
        }
        
        // Find category (with caching)
        let category = null;
        if (row.Category && row.Category !== 'N/A') {
          const categoryKey = `${row.Category}_${businessUnit?.id || 'null'}`;
          category = categoryCache.get(categoryKey);
          if (!category) {
            category = await prisma.category.findFirst({
              where: { 
                name: row.Category,
                businessUnitId: businessUnit?.id
              }
            });
            if (!category) {
              // Try without businessUnitId
              category = await prisma.category.findFirst({
                where: { name: row.Category }
              });
            }
            if (category) {
              categoryCache.set(categoryKey, category);
            }
          }
        }
        
        // Find range (with caching)
        let range = null;
        if (row.Range && row.Range !== 'N/A') {
          range = rangeCache.get(row.Range);
          if (!range) {
            range = await prisma.range.findFirst({
              where: { name: row.Range }
            });
            if (range) {
              rangeCache.set(row.Range, range);
            }
          }
        }
        
        // Find campaign (with caching)
        let campaign = null;
        if (row.Campaign) {
          const campaignKey = `${row.Campaign}_${range?.id || 'null'}`;
          campaign = campaignCache.get(campaignKey);
          if (!campaign) {
            campaign = await prisma.campaign.findFirst({
              where: { 
                name: row.Campaign,
                rangeId: range?.id
              }
            });
            if (!campaign) {
              // Try without rangeId
              campaign = await prisma.campaign.findFirst({
                where: { name: row.Campaign }
              });
            }
            if (campaign) {
              campaignCache.set(campaignKey, campaign);
            }
          }
        }
        
        // Parse numeric fields
        const tvDemoMinAge = parseNumber(row['TV Demo Min. Age']);
        const tvDemoMaxAge = parseNumber(row['TV Demo Max. Age']);
        const digitalDemoMinAge = parseNumber(row['Digital Demo Min. Age']);
        const digitalDemoMaxAge = parseNumber(row['Digital Demo Max. Age']);
        const cpp2024 = parseNumber(row['CPP 2024']);
        const cpp2025 = parseNumber(row['CPP 2025']);
        const cpp2026 = parseNumber(row['CPP 2026']);
        
        // Parse percentage fields (keep as strings)
        const tvPlannedR1Plus = parsePercentage(row['Total TV Planned R1+ (%)']);
        const tvPlannedR3Plus = parsePercentage(row['Total TV Planned R3+ (%)']);
        const tvPotentialR1Plus = parsePercentage(row['TV Optimal R1+']);
        const digitalPlannedR1Plus = parsePercentage(row['Total Digital Planned R1+']);
        const digitalPotentialR1Plus = parsePercentage(row['Total Digital Optimal R1+']);
        const plannedCombinedReach = parsePercentage(row['Planned Combined Reach (Don\'t fill)']);
        const combinedPotentialReach = parsePercentage(row['Combined Potential Reach']);
        
        // Parse boolean field
        const isDigitalTargetSameAsTv = parseBoolean(row['Is Digital target the same than TV?']);
        
        // Create media sufficiency entry
        const mediaSufficiency = await prisma.mediaSufficiency.create({
          data: {
            lastUpdate: 'FC05 2025',
            lastUpdateId: lastUpdate.id,
            country: row.Country,
            countryId: country?.id,
            bu: row['Business Unit'] !== 'N/A' ? row['Business Unit'] : null,
            buId: businessUnit?.id,
            category: row.Category !== 'N/A' ? row.Category : null,
            categoryId: category?.id,
            range: row.Range !== 'N/A' ? row.Range : null,
            rangeId: range?.id,
            campaign: row.Campaign,
            campaignId: campaign?.id,
            // TV Demographics & Targeting
            tvDemoGender: row['TV Demo Gender'] !== 'N/A' ? row['TV Demo Gender'] : null,
            tvDemoMinAge,
            tvDemoMaxAge,
            tvSel: row['TV SEL'] !== 'N/A' ? row['TV SEL'] : null,
            finalTvTarget: row['Final TV Target (don\'t fill)'] !== 'N/A' ? row['Final TV Target (don\'t fill)'] : null,
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
            finalDigitalTarget: row['Final Digital Target (don\'t fill)'] !== 'N/A' ? row['Final Digital Target (don\'t fill)'] : null,
            digitalTargetSizeAbs: row['Digital Target Size (Abs)'] !== 'N/A' ? row['Digital Target Size (Abs)'] : null,
            // Digital Performance Metrics
            digitalPlannedR1Plus,
            digitalPotentialR1Plus,
            // Combined Metrics
            plannedCombinedReach,
            combinedPotentialReach,
            // System Fields
            uploadedBy: 'FC05 Import Script',
            uploadSession: `fc05-import-${new Date().toISOString()}`
          }
        });
        
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`Imported ${successCount} records...`);
        }
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Error on row ${index + 2} (${row.Campaign}): ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Successfully imported: ${successCount} records`);
    console.log(`Errors: ${errorCount} records`);
    
    if (errors.length > 0) {
      console.log('\nFirst 10 errors:');
      errors.slice(0, 10).forEach(err => console.log(err));
    }
    
    // Verify the import
    const importedCount = await prisma.mediaSufficiency.count({
      where: { lastUpdateId: lastUpdate.id }
    });
    console.log(`\nTotal Media Sufficiency records for FC05 2025: ${importedCount}`);
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importMediaSufficiency();