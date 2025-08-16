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
  
  // Try standard date parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper function to parse budget values
function parseBudget(value: string): number {
  if (!value || value === 'N/A' || value === '') return 0;
  // Remove commas and currency symbols
  const cleaned = value.replace(/[,$]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

async function importGamePlans() {
  try {
    console.log('Starting FC05 2025 Game Plans import (Fixed version)...');
    
    // Find or create the FC05 2025 last update entry
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
    
    const records: CSVRow[] = await new Promise((resolve, reject) => {
      csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    console.log(`Found ${records.length} records to import`);
    
    let importedCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; campaign: string; error: string }> = [];
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed
      
      try {
        // Find or create country
        let country = await prisma.country.findFirst({
          where: { name: row.Country }
        });
        
        if (!country) {
          country = await prisma.country.create({
            data: { 
              name: row.Country,
              regionId: 1 // Default to first region
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
            try {
              businessUnit = await prisma.businessUnit.create({
                data: { name: row['Business Unit'] }
              });
              console.log(`Created business unit: ${row['Business Unit']}`);
            } catch (e) {
              // If creation fails due to unique constraint, try to find it again
              businessUnit = await prisma.businessUnit.findFirst({
                where: { name: row['Business Unit'] }
              });
            }
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
            try {
              category = await prisma.category.create({
                data: { 
                  name: row.Category,
                  businessUnitId: businessUnit.id
                }
              });
              console.log(`Created category: ${row.Category}`);
            } catch (e) {
              // If creation fails, try to find without businessUnitId constraint
              category = await prisma.category.findFirst({
                where: { name: row.Category }
              });
            }
          }
        }
        
        // Find or create range
        let range = null;
        if (row.Range && row.Range !== 'N/A') {
          range = await prisma.range.findFirst({
            where: { name: row.Range }
          });
          
          if (!range) {
            try {
              range = await prisma.range.create({
                data: { name: row.Range }
              });
              console.log(`Created range: ${row.Range}`);
            } catch (e) {
              // If creation fails, try to find it again
              range = await prisma.range.findFirst({
                where: { name: row.Range }
              });
            }
          }
        }
        
        // Find or create campaign
        let campaign = await prisma.campaign.findFirst({
          where: { 
            name: row.Campaign
          }
        });
        
        if (!campaign) {
          try {
            campaign = await prisma.campaign.create({
              data: { 
                name: row.Campaign,
                rangeId: range?.id
              }
            });
            console.log(`Created campaign: ${row.Campaign}`);
          } catch (e) {
            // If creation fails, find without rangeId
            campaign = await prisma.campaign.findFirst({
              where: { name: row.Campaign }
            });
          }
        }
        
        // Skip if campaign not found or created
        if (!campaign) {
          throw new Error(`Could not find or create campaign: ${row.Campaign}`);
        }
        
        // Find or create campaign archetype
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
              console.log(`Created campaign archetype: ${row['Campaign Archetype']}`);
            } catch (e) {
              campaignArchetype = await prisma.campaignArchetype.findFirst({
                where: { name: row['Campaign Archetype'] }
              });
            }
          }
        }
        
        // Find or create media type
        let mediaType = await prisma.mediaType.findFirst({
          where: { name: row.Media || 'Digital' }
        });
        
        if (!mediaType) {
          try {
            mediaType = await prisma.mediaType.create({
              data: { name: row.Media || 'Digital' }
            });
            console.log(`Created media type: ${row.Media}`);
          } catch (e) {
            mediaType = await prisma.mediaType.findFirst({
              where: { name: row.Media || 'Digital' }
            });
          }
        }
        
        // Find or create media subtype
        let mediaSubType = await prisma.mediaSubType.findFirst({
          where: { 
            name: row['Media Subtype'] || 'Other',
            mediaTypeId: mediaType?.id || 1
          }
        });
        
        if (!mediaSubType) {
          try {
            mediaSubType = await prisma.mediaSubType.create({
              data: { 
                name: row['Media Subtype'] || 'Other',
                mediaTypeId: mediaType?.id || 1
              }
            });
            console.log(`Created media subtype: ${row['Media Subtype']}`);
          } catch (e) {
            mediaSubType = await prisma.mediaSubType.findFirst({
              where: { name: row['Media Subtype'] || 'Other' }
            });
          }
        }
        
        if (!mediaSubType) {
          throw new Error(`Could not find or create media subtype: ${row['Media Subtype']}`);
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
        const totalWeeks = parseBudget(row['Total Weeks']);
        
        // Create game plan entry
        const gamePlan = await prisma.gamePlan.create({
          data: {
            campaignId: campaign.id,
            mediaSubTypeId: mediaSubType.id,
            countryId: country.id,
            business_unit_id: businessUnit?.id,
            category_id: category?.id,
            range_id: range?.id,
            campaignArchetypeId: campaignArchetype?.id,
            last_update_id: lastUpdate.id,
            playbook_id: row['Playbook ID'] || null,
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
          console.log(`Imported ${importedCount} records...`);
        }
        
      } catch (error: any) {
        errorCount++;
        errors.push({
          row: rowNumber,
          campaign: row.Campaign,
          error: error.message || String(error)
        });
        
        // Continue with next record instead of stopping
        continue;
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Successfully imported: ${importedCount} records`);
    console.log(`Errors: ${errorCount} records`);
    
    if (errors.length > 0) {
      console.log(`\nFirst 10 errors:`);
      errors.slice(0, 10).forEach(err => {
        console.log(`Row ${err.row} (${err.campaign}): ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importGamePlans();