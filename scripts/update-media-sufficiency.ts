import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Initialize Prisma client
const prisma = new PrismaClient();

// Path to the CSV file
const csvFilePath = path.join(process.cwd(), 'media-sufficiency-sample.csv');

async function main() {
  try {
    console.log('Starting media sufficiency data update process...');
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Parsed ${records.length} records from CSV file`);
    
    // Step 1: Delete all existing campaign media data
    console.log('Deleting existing campaign media data...');
    await prisma.campaignMedia.deleteMany({});
    console.log('Existing campaign media data deleted');
    
    // Step 2: Delete all existing campaigns
    console.log('Deleting existing campaigns...');
    await prisma.campaign.deleteMany({});
    console.log('Existing campaigns deleted');
    
    // Step 3: Process and import the new data
    console.log('Processing and importing new data...');
    
    // Create a map to store entity IDs to avoid duplicate lookups
    const subRegionMap = new Map();
    const countryMap = new Map();
    const categoryMap = new Map();
    const rangeMap = new Map();
    const mediaTypeMap = new Map();
    const mediaSubtypeMap = new Map();
    const businessUnitMap = new Map();
    const pmTypeMap = new Map();
    const campaignNameMap = new Map();
    
    // Process each record
    for (const record of records) {
      // Skip records with empty required fields
      if (!record['Year'] || !record['Country'] || !record['Category'] || 
          !record['Range'] || !record['Campaign'] || !record['Media'] || 
          !record['Media Subtype'] || !record['Start Date'] || !record['End Date'] || 
          !record['Budget']) {
        console.log('Skipping record with missing required fields:', record);
        continue;
      }
      
      try {
        // Declare burst variable at the top
        let burst = 1;
        // Parse dates first, as we need them to determine the burst
        let startDate, endDate;
        try {
          // Parse date in DD-MMM-YY format (e.g., 01-Feb-25)
          const startDateParts = record['Start Date'].split('-');
          const endDateParts = record['End Date'].split('-');
          
          // Ensure the date parts are valid
          if (startDateParts.length === 3 && endDateParts.length === 3) {
            // Convert month abbreviation to month number (0-11)
            const startMonthNum = getMonthNumber(startDateParts[1]);
            const endMonthNum = getMonthNumber(endDateParts[1]);
            
            // Parse year (add 2000 to convert '25' to 2025)
            const startYear = 2000 + parseInt(startDateParts[2]);
            const endYear = 2000 + parseInt(endDateParts[2]);
            
            // Create date objects with the correct format (YYYY-MM-DD)
            startDate = new Date(startYear, startMonthNum, parseInt(startDateParts[0]));
            endDate = new Date(endYear, endMonthNum, parseInt(endDateParts[0]));
            
            console.log(`Parsed dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
          } else {
            console.log('Invalid date format, using current date as fallback');
            startDate = new Date();
            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months duration
          }
        } catch (error) {
          console.log('Error parsing dates, using current date as fallback:', error);
          startDate = new Date();
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months duration
        }
        
        // Determine burst based on start date
        // Group campaigns into bursts based on their start month
        const startMonth = startDate.getMonth() + 1; // 1-12
        
        // Assign burst based on quarter
        if (startMonth <= 3) {
          burst = 1; // Q1
        } else if (startMonth <= 6) {
          burst = 2; // Q2
        } else if (startMonth <= 9) {
          burst = 3; // Q3
        } else {
          burst = 4; // Q4
        }
        
        // Get or create SubRegion
        let subRegionId;
        const subRegion = record['Sub Region'];
        if (subRegion) {
          if (subRegionMap.has(subRegion)) {
            subRegionId = subRegionMap.get(subRegion);
          } else {
            const subRegionEntity = await prisma.subRegion.upsert({
              where: { name: subRegion },
              update: {},
              create: { name: subRegion }
            });
            subRegionId = subRegionEntity.id;
            subRegionMap.set(subRegion, subRegionId);
          }
        } else {
          console.log('Skipping record with missing Sub Region:', record);
          continue;
        }
        
        // Get or create Country
        let countryId;
        const country = record['Country'];
        if (country) {
          if (countryMap.has(country)) {
            countryId = countryMap.get(country);
          } else {
            const countryEntity = await prisma.mSCountry.upsert({
              where: { name: country },
              update: { 
                subRegionId,
                cluster: record['Cluster'] || null
              },
              create: { 
                name: country, 
                subRegionId,
                cluster: record['Cluster'] || null
              }
            });
            countryId = countryEntity.id;
            countryMap.set(country, countryId);
          }
        } else {
          console.log('Skipping record with missing Country:', record);
          continue;
        }
        
        // Get or create Category
        let categoryId;
        const category = record['Category'];
        if (category) {
          if (categoryMap.has(category)) {
            categoryId = categoryMap.get(category);
          } else {
            const categoryEntity = await prisma.category.upsert({
              where: { name: category },
              update: {},
              create: { name: category }
            });
            categoryId = categoryEntity.id;
            categoryMap.set(category, categoryId);
          }
        } else {
          console.log('Skipping record with missing Category:', record);
          continue;
        }
        
        // Get or create Range
        let rangeId;
        const range = record['Range'];
        if (range) {
          const rangeKey = `${range}_${category}`;
          if (rangeMap.has(rangeKey)) {
            rangeId = rangeMap.get(rangeKey);
          } else {
            const rangeEntity = await prisma.range.upsert({
              where: { 
                name_categoryId: {
                  name: range,
                  categoryId
                }
              },
              update: {},
              create: { 
                name: range, 
                categoryId
              }
            });
            rangeId = rangeEntity.id;
            rangeMap.set(rangeKey, rangeId);
          }
        } else {
          console.log('Skipping record with missing Range:', record);
          continue;
        }
        
        // Get or create MediaType
        let mediaTypeId;
        const mediaType = record['Media'];
        if (mediaType) {
          if (mediaTypeMap.has(mediaType)) {
            mediaTypeId = mediaTypeMap.get(mediaType);
          } else {
            const mediaTypeEntity = await prisma.mediaType.upsert({
              where: { name: mediaType },
              update: {},
              create: { name: mediaType }
            });
            mediaTypeId = mediaTypeEntity.id;
            mediaTypeMap.set(mediaType, mediaTypeId);
          }
        } else {
          console.log('Skipping record with missing Media:', record);
          continue;
        }
        
        // Get or create MediaSubtype
        let mediaSubtypeId;
        const mediaSubtype = record['Media Subtype'];
        if (mediaSubtype) {
          const mediaSubtypeKey = `${mediaSubtype}_${mediaType}`;
          if (mediaSubtypeMap.has(mediaSubtypeKey)) {
            mediaSubtypeId = mediaSubtypeMap.get(mediaSubtypeKey);
          } else {
            const mediaSubtypeEntity = await prisma.mediaSubtype.upsert({
              where: { 
                name_mediaTypeId: {
                  name: mediaSubtype,
                  mediaTypeId
                }
              },
              update: {},
              create: { 
                name: mediaSubtype, 
                mediaTypeId
              }
            });
            mediaSubtypeId = mediaSubtypeEntity.id;
            mediaSubtypeMap.set(mediaSubtypeKey, mediaSubtypeId);
          }
        } else {
          console.log('Skipping record with missing Media Subtype:', record);
          continue;
        }
        
        // Get or create BusinessUnit
        let businessUnitId = null;
        const businessUnit = record['BU'];
        if (businessUnit) {
          if (businessUnitMap.has(businessUnit)) {
            businessUnitId = businessUnitMap.get(businessUnit);
          } else {
            const businessUnitEntity = await prisma.businessUnit.upsert({
              where: { name: businessUnit },
              update: {},
              create: { name: businessUnit }
            });
            businessUnitId = businessUnitEntity.id;
            businessUnitMap.set(businessUnit, businessUnitId);
          }
        }
        
        // Get or create PMType
        let pmTypeId = null;
        const pmType = record['PM Type'];
        if (pmType) {
          if (pmTypeMap.has(pmType)) {
            pmTypeId = pmTypeMap.get(pmType);
          } else {
            const pmTypeEntity = await prisma.pMType.upsert({
              where: { name: pmType },
              update: {},
              create: { name: pmType }
            });
            pmTypeId = pmTypeEntity.id;
            pmTypeMap.set(pmType, pmTypeId);
          }
        }
        
        // Get or create CampaignName
        let campaignNameId = null;
        const campaignName = record['Campaign'];
        if (campaignName) {
          if (campaignNameMap.has(campaignName)) {
            campaignNameId = campaignNameMap.get(campaignName);
          } else {
            const campaignNameEntity = await prisma.campaignName.upsert({
              where: { name: campaignName },
              update: {},
              create: { name: campaignName }
            });
            campaignNameId = campaignNameEntity.id;
            campaignNameMap.set(campaignName, campaignNameId);
          }
        } else {
          console.log('Skipping record with missing Campaign:', record);
          continue;
        }
        
        // Create or update Campaign
        // Important: Use FC05 2025 instead of FY2025 for the year
        const year = 2025; // Hardcoded to 2025 as per requirement
        
        // Use upsert to handle duplicate campaigns
        // The burst value is determined by the start date
        const campaign = await prisma.campaign.upsert({
          where: {
            name_rangeId_countryId_year_burst: {
              name: campaignName,
              rangeId,
              countryId,
              year,
              burst
            }
          },
          update: {
            // Update businessUnitId if it's provided
            ...(businessUnitId ? { businessUnitId } : {}),
            // Update campaignNameId if it's provided
            ...(campaignNameId ? { campaignNameId } : {})
          },
          create: {
            name: campaignName,
            campaignNameId,
            rangeId,
            countryId,
            businessUnitId,
            year,
            burst // Use the calculated burst value
          }
        });
        
        // Parse budget values
        const totalBudget = parseFloat(record['Budget']) || 0;
        
        // Parse quarterly budgets, handling blank or dash values
        const q1Budget = parseFloatOrNull(record['Q1 Budget']);
        const q2Budget = parseFloatOrNull(record['Q2 Budget']);
        const q3Budget = parseFloatOrNull(record['Q3 Budget']);
        const q4Budget = parseFloatOrNull(record['Q4 Budget']);
        
        // Parse reach and TRPs values
        const trps = parseFloatOrNull(record['TRPs']);
        const reach1Plus = parseFloatOrNull(record['Reach 1+']);
        const reach3Plus = parseFloatOrNull(record['Reach 3+']);
        
        // Create CampaignMedia
        await prisma.campaignMedia.create({
          data: {
            campaignId: campaign.id,
            mediaSubtypeId,
            pmTypeId,
            startDate,
            endDate,
            totalBudget,
            q1Budget,
            q2Budget,
            q3Budget,
            q4Budget,
            trps,
            reach1Plus,
            reach3Plus
          }
        });
        
        console.log(`Imported campaign: ${campaignName}, Media: ${mediaType}/${mediaSubtype}`);
        
      } catch (error) {
        console.error('Error processing record:', record, error);
      }
    }
    
    console.log('Data import completed successfully!');
    
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to convert month abbreviation to month number (0-11)
function getMonthNumber(monthAbbr: string): number {
  const months: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };
  
  // Normalize the month abbreviation (lowercase)
  const normalizedMonth = monthAbbr.toLowerCase();
  
  // Return the month number or default to January (0) if not found
  return months[normalizedMonth] !== undefined ? months[normalizedMonth] : 0;
}

// Helper function to parse float values, handling blank or dash values
function parseFloatOrNull(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') {
    return null;
  }
  
  // Remove any commas and convert to number
  const numValue = parseFloat(value.replace(/,/g, ''));
  return isNaN(numValue) ? null : numValue;
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });