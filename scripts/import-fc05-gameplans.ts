import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse';

const prisma = new PrismaClient();

interface CSVRow {
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
  'Total Weeks': string;
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

// Helper function to parse dates
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
  
  return null;
}

// Helper function to parse budget values
function parseBudget(value: string): number {
  if (!value || value === 'N/A' || value.trim() === '' || value.trim() === '-') return 0;
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

async function importGamePlans() {
  try {
    console.log('Starting FC05 2025 Game Plans import...');
    
    // First, create or get the FC05 2025 last update entry
    let lastUpdate = await prisma.lastUpdate.findFirst({
      where: { name: 'FC05 2025' }
    });
    
    if (!lastUpdate) {
      lastUpdate = await prisma.lastUpdate.create({
        data: { name: 'FC05 2025' }
      });
      console.log('Created FC05 2025 financial cycle');
    } else {
      console.log('Found existing FC05 2025 financial cycle');
    }
    
    // Read and parse CSV file
    const csvFilePath = '/Users/naveedshah/Downloads/FC05 data_clean and in Nebula template_Gameplan tab.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Remove BOM if present
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    
    // Parse CSV
    const records = await new Promise<CSVRow[]>((resolve, reject) => {
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
    
    for (const [index, row] of records.entries()) {
      try {
        // Skip empty rows
        if (!row.Campaign || !row.Country) {
          console.log(`Skipping row ${index + 2}: Missing campaign or country`);
          continue;
        }
        
        // Find or create country
        let country = await prisma.country.findFirst({
          where: { name: row.Country }
        });
        
        if (!country) {
          // Need to create a region first for the country
          let region = await prisma.region.findFirst({
            where: { name: 'Middle East & Africa' }  // Default region for Egypt
          });
          
          if (!region) {
            region = await prisma.region.create({
              data: { name: 'Middle East & Africa' }
            });
          }
          
          country = await prisma.country.create({
            data: { 
              name: row.Country,
              regionId: region.id
            }
          });
          console.log(`Created country: ${row.Country}`);
        }
        
        // Find or create business unit
        let businessUnit = null;
        if (row['Business Unit'] && row['Business Unit'] !== 'N/A') {
          businessUnit = await prisma.businessUnit.findFirst({
            where: { name: row['Business Unit'] }
          });
          
          if (!businessUnit) {
            businessUnit = await prisma.businessUnit.create({
              data: { name: row['Business Unit'] }
            });
            console.log(`Created business unit: ${row['Business Unit']}`);
          }
        }
        
        // Find or create category
        let category = null;
        if (row.Category && row.Category !== 'N/A') {
          category = await prisma.category.findFirst({
            where: { 
              name: row.Category,
              businessUnitId: businessUnit?.id
            }
          });
          
          if (!category && businessUnit) {
            category = await prisma.category.create({
              data: { 
                name: row.Category,
                businessUnitId: businessUnit.id
              }
            });
            console.log(`Created category: ${row.Category}`);
          }
        }
        
        // Find or create range
        let range = null;
        if (row.Range && row.Range !== 'N/A') {
          range = await prisma.range.findFirst({
            where: { name: row.Range }
          });
          
          if (!range) {
            range = await prisma.range.create({
              data: { name: row.Range }
            });
            console.log(`Created range: ${row.Range}`);
          }
        }
        
        // Find or create campaign
        let campaign = await prisma.campaign.findFirst({
          where: { 
            name: row.Campaign,
            rangeId: range?.id
          }
        });
        
        if (!campaign) {
          campaign = await prisma.campaign.create({
            data: { 
              name: row.Campaign,
              rangeId: range?.id
            }
          });
          console.log(`Created campaign: ${row.Campaign}`);
        }
        
        // Find or create campaign archetype
        let campaignArchetype = null;
        if (row['Campaign Archetype'] && row['Campaign Archetype'] !== 'N/A') {
          campaignArchetype = await prisma.campaignArchetype.findFirst({
            where: { name: row['Campaign Archetype'] }
          });
          
          if (!campaignArchetype) {
            campaignArchetype = await prisma.campaignArchetype.create({
              data: { name: row['Campaign Archetype'] }
            });
            console.log(`Created campaign archetype: ${row['Campaign Archetype']}`);
          }
        }
        
        // Find or create media type
        let mediaType = await prisma.mediaType.findFirst({
          where: { name: row.Media || 'Digital' }
        });
        
        if (!mediaType) {
          mediaType = await prisma.mediaType.create({
            data: { name: row.Media || 'Digital' }
          });
          console.log(`Created media type: ${row.Media}`);
        }
        
        // Find or create media subtype
        let mediaSubType = await prisma.mediaSubType.findFirst({
          where: { 
            name: row['Media Subtype'] || 'Other',
            mediaTypeId: mediaType.id
          }
        });
        
        if (!mediaSubType) {
          mediaSubType = await prisma.mediaSubType.create({
            data: { 
              name: row['Media Subtype'] || 'Other',
              mediaTypeId: mediaType.id
            }
          });
          console.log(`Created media subtype: ${row['Media Subtype']}`);
        }
        
        // Parse dates and convert to ISO string if valid
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
        const totalWeeks = parseBudget(row['Total Weeks']);
        
        // Create game plan entry
        const gamePlan = await prisma.gamePlan.create({
          data: {
            campaignId: campaign.id,
            mediaSubTypeId: mediaSubType.id,
            countryId: country.id,
            business_unit_id: businessUnit?.id,
            category_id: category?.id,
            campaignArchetypeId: campaignArchetype?.id,
            last_update_id: lastUpdate.id,
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
            totalWeeks: totalWeeks || 0
          }
        });
        
        successCount++;
        if (successCount % 50 === 0) {
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
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importGamePlans();