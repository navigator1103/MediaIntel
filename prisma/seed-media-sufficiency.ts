import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function seedMediaSufficiencyData() {
  try {
    console.log('Seeding Media Sufficiency data...');
    
    // Read the CSV file
    const csvFilePath = path.resolve(process.cwd(), '5. EM-Sufficiency_Raw Data Sheet.csv');
    console.log('CSV file path:', csvFilePath);
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse the CSV data
    // First, split by lines and remove the first line (which is just a number)
    const lines = csvData.split('\n');
    const csvDataWithoutFirstLine = lines.slice(1).join('\n');
    
    // Parse the CSV data
    const records = parse(csvDataWithoutFirstLine, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      from_line: 2 // Skip the header row
    });
    
    console.log(`Parsed ${records.length} records from CSV file`);
    if (records.length > 0) {
      console.log('Sample record keys:', Object.keys(records[0]));
      console.log('Sample record values:', Object.values(records[0]));
    }
    
    // Extract unique values for each entity
    const subRegions = new Set();
    const countries = new Map(); // country name -> { subRegion, cluster }
    const categories = new Set();
    const ranges = new Map(); // range name -> category
    const mediaTypes = new Set();
    const mediaSubtypes = new Map(); // subtype name -> media type
    
    // Process each record to extract unique values
    let processedRecords = 0;
    
    for (const record of records) {
      // Skip empty records or header rows
      if (!record['Year'] || record['Year'].trim() === '') {
        continue;
      }
      
      const subRegion = record['Sub Region'];
      const country = record['Country'];
      const category = record['Category'];
      const range = record['Range'];
      const media = record['Media'];
      const mediaSubtype = record['Media Subtype'];
      
      if (!subRegion || !country || !category || !range || !media || !mediaSubtype) {
        console.log('Skipping record with missing critical data');
        continue; // Skip records with missing critical data
      }
      
      processedRecords++;
      
      subRegions.add(subRegion);
      
      countries.set(country, {
        subRegion: subRegion,
        cluster: record['Cluster'] || null
      });
      
      categories.add(category);
      
      ranges.set(`${range}_${category}`, {
        name: range,
        category: category
      });
      
      mediaTypes.add(media);
      
      mediaSubtypes.set(`${mediaSubtype}_${media}`, {
        name: mediaSubtype,
        mediaType: media
      });
    }
    
    console.log(`Processed ${processedRecords} records for unique values`);
    
    // Create SubRegions
    const subRegionMap = new Map();
    for (const subRegion of subRegions) {
      const createdSubRegion = await prisma.subRegion.upsert({
        where: { name: String(subRegion) },
        update: {},
        create: { name: String(subRegion) }
      });
      subRegionMap.set(subRegion, createdSubRegion.id);
      console.log(`Created SubRegion: ${subRegion}`);
    }
    
    // Create Countries
    const countryMap = new Map();
    for (const [countryName, data] of countries.entries()) {
      const subRegionId = subRegionMap.get(data.subRegion);
      if (!subRegionId) continue;
      
      const createdCountry = await prisma.mSCountry.upsert({
        where: { name: String(countryName) },
        update: { 
          subRegionId,
          cluster: data.cluster ? String(data.cluster) : null
        },
        create: {
          name: String(countryName),
          subRegionId,
          cluster: data.cluster ? String(data.cluster) : null
        }
      });
      countryMap.set(countryName, createdCountry.id);
      console.log(`Created Country: ${countryName}`);
    }
    
    // Create Categories
    const categoryMap = new Map();
    for (const category of categories) {
      const createdCategory = await prisma.category.upsert({
        where: { name: String(category) },
        update: {},
        create: { name: String(category) }
      });
      categoryMap.set(category, createdCategory.id);
      console.log(`Created Category: ${category}`);
    }
    
    // Create Ranges
    const rangeMap = new Map();
    for (const [key, data] of ranges.entries()) {
      const categoryId = categoryMap.get(data.category);
      if (!categoryId) continue;
      
      const createdRange = await prisma.range.upsert({
        where: {
          name_categoryId: {
            name: String(data.name),
            categoryId
          }
        },
        update: {},
        create: {
          name: String(data.name),
          categoryId
        }
      });
      rangeMap.set(key, createdRange.id);
      console.log(`Created Range: ${data.name} for Category: ${data.category}`);
    }
    
    // Create Media Types
    const mediaTypeMap = new Map();
    for (const mediaType of mediaTypes) {
      const createdMediaType = await prisma.mediaType.upsert({
        where: { name: String(mediaType) },
        update: {},
        create: { name: String(mediaType) }
      });
      mediaTypeMap.set(mediaType, createdMediaType.id);
      console.log(`Created Media Type: ${mediaType}`);
    }
    
    // Create Media Subtypes
    const mediaSubtypeMap = new Map();
    for (const [key, data] of mediaSubtypes.entries()) {
      const mediaTypeId = mediaTypeMap.get(data.mediaType);
      if (!mediaTypeId) continue;
      
      const createdMediaSubtype = await prisma.mediaSubtype.upsert({
        where: {
          name_mediaTypeId: {
            name: String(data.name),
            mediaTypeId
          }
        },
        update: {},
        create: {
          name: String(data.name),
          mediaTypeId
        }
      });
      mediaSubtypeMap.set(key, createdMediaSubtype.id);
      console.log(`Created Media Subtype: ${data.name} for Media Type: ${data.mediaType}`);
    }
    
    // Process campaigns and campaign media
    const campaignMap = new Map(); // Track campaigns to avoid duplicates
    
    // Import records for the dashboard
    const validRecords = records.filter(record => 
      record['Year'] && 
      record['Sub Region'] && 
      record['Country'] && 
      record['Category'] && 
      record['Range'] && 
      record['Campaign'] && 
      record['Media'] && 
      record['Media Subtype'] && 
      record['Total Budget']
    );
    
    // Import more records to ensure we have enough data for the dashboard
    const limitedRecords = validRecords.slice(0, 500);
    console.log(`Processing ${limitedRecords.length} valid records for import`);
    
    for (const record of limitedRecords) {
      // We've already filtered for valid records, but double-check
      if (!record['Sub Region'] || !record['Country'] || !record['Category'] || !record['Range'] || 
          !record['Campaign'] || !record['Year'] || !record['Media'] || !record['Media Subtype'] ||
          !record['Initial Date'] || !record['End Date'] || !record['Total Budget']) {
        continue; // Skip records with missing critical data
      }
      
      // Parse budget values - handle formatting like ' 428 '
      const totalBudget = parseFloat(record['Total Budget'].toString().replace(/[^0-9.-]+/g, '')) || 0;
      const q1Budget = record['Q1'] ? parseFloat(record['Q1'].toString().replace(/[^0-9.-]+/g, '')) || 0 : 0;
      const q2Budget = record['Q2'] ? parseFloat(record['Q2'].toString().replace(/[^0-9.-]+/g, '')) || 0 : 0;
      const q3Budget = record['Q3'] ? parseFloat(record['Q3'].toString().replace(/[^0-9.-]+/g, '')) || 0 : 0;
      const q4Budget = record['Q4'] ? parseFloat(record['Q4'].toString().replace(/[^0-9.-]+/g, '')) || 0 : 0;
      
      const countryId = countryMap.get(record['Country']);
      const rangeKey = `${record['Range']}_${record['Category']}`;
      const rangeId = rangeMap.get(rangeKey);
      const mediaSubtypeKey = `${record['Media Subtype']}_${record['Media']}`;
      const mediaSubtypeId = mediaSubtypeMap.get(mediaSubtypeKey);
      
      if (!countryId || !rangeId || !mediaSubtypeId) continue;
      
      // Create unique campaign key
      const campaignKey = `${record['Campaign']}_${rangeId}_${countryId}_${record['Year']}_${record['Burst'] || 1}`;
      
      // Create campaign if it doesn't exist
      let campaignId = campaignMap.get(campaignKey);
      if (!campaignId) {
        const campaign = await prisma.campaign.create({
          data: {
            name: String(record['Campaign']),
            rangeId,
            countryId,
            year: parseInt(String(record['Year'])),
            playbackId: record['Playb ID'] ? String(record['Playb ID']) : null,
            burst: parseInt(String(record['Burst'] || '1')),
            totalBudget: totalBudget,
            q1Budget: q1Budget,
            q2Budget: q2Budget,
            q3Budget: q3Budget,
            q4Budget: q4Budget
          }
        });
        campaignId = campaign.id;
        campaignMap.set(campaignKey, campaignId);
        console.log(`Created Campaign: ${record['Campaign']}`);
      }
      
      // Parse dates
      let startDate, endDate;
      try {
        // Assuming date format is DD-MMM-YY (e.g., 1-Feb-25)
        const startDateStr = String(record['Initial Date']);
        const endDateStr = String(record['End Date']);
        const startParts = startDateStr.split('-');
        const endParts = endDateStr.split('-');
        
        // Convert month name to month number
        const monthMap: Record<string, string> = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        // Format: YYYY-MM-DD
        const startYear = `20${startParts[2]}`;
        const startMonth = monthMap[startParts[1]];
        const startDay = startParts[0].padStart(2, '0');
        startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
        
        const endYear = `20${endParts[2]}`;
        const endMonth = monthMap[endParts[1]];
        const endDay = endParts[0].padStart(2, '0');
        endDate = new Date(`${endYear}-${endMonth}-${endDay}`);
      } catch (error) {
        console.error(`Error parsing dates for campaign ${record['Campaign']}:`, error);
        continue;
      }
      
      // We already parsed budget values earlier, so we don't need to do it again
      
      // Parse TRP and reach values
      const trps = record['Total TRPs'] ? parseFloat(String(record['Total TRPs']).replace(/[^0-9.-]+/g, '')) || null : null;
      const reach1Plus = record['Total R1+'] ? parseFloat(String(record['Total R1+']).replace(/[^0-9.-]+/g, '')) / 100 || null : null;
      const reach3Plus = record['Total R3+'] ? parseFloat(String(record['Total R3+']).replace(/[^0-9.-]+/g, '')) / 100 || null : null;
      
      // Create campaign media
      await prisma.campaignMedia.create({
        data: {
          campaignId,
          mediaSubtypeId,
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
      console.log(`Created Campaign Media for Campaign: ${record['Campaign']} with Media: ${record['Media']} - ${record['Media Subtype']}`);
    }
    
    // Count records in database to verify seeding
    const campaignCount = await prisma.campaign.count();
    const categoryCount = await prisma.category.count();
    const countryCount = await prisma.mSCountry.count();
    const mediaTypeCount = await prisma.mediaType.count();
    
    console.log('Database record counts after seeding:');
    console.log(`- Campaigns: ${campaignCount}`);
    console.log(`- Categories: ${categoryCount}`);
    console.log(`- Countries: ${countryCount}`);
    console.log(`- Media Types: ${mediaTypeCount}`);
    
    console.log('Media Sufficiency data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding Media Sufficiency data:', error);
    throw error;
  }
}

export { seedMediaSufficiencyData };
