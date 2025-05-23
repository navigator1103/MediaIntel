import { PrismaClient } from '@prisma/client';

// Constants based on the DataProcessing project
const PM_TYPES = {
  'Basic PM': 1,
  'Full Funnel Advanced': 2,
  'Full Funnel Basic': 3,
  'GR Only': 4,
  'Non PM': 5,
  'PM Advanced': 6
};

// Helper functions
function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function calculateQuarterBudget(date: Date, endDate: Date, totalBudget: number): { q1: number, q2: number, q3: number, q4: number } {
  const startMonth = date.getMonth();
  const endMonth = endDate.getMonth();
  const duration = endMonth - startMonth + 1;
  
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
  const monthlyBudget = totalBudget / duration;
  
  // Distribute budget across quarters based on campaign duration
  for (let m = startMonth; m <= endMonth; m++) {
    if (m < 3) q1 += monthlyBudget;
    else if (m < 6) q2 += monthlyBudget;
    else if (m < 9) q3 += monthlyBudget;
    else q4 += monthlyBudget;
  }
  
  return { 
    q1: Math.round(q1 * 100) / 100, 
    q2: Math.round(q2 * 100) / 100, 
    q3: Math.round(q3 * 100) / 100, 
    q4: Math.round(q4 * 100) / 100 
  };
}

// Define types for our data structures
type MediaItem = {
  mediaType: string;
  mediaSubtype: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  trps?: number | null;
  reach1Plus?: number | null;
  reach3Plus?: number | null;
};

type Campaign = {
  name: string;
  range: string;
  category: string;
  country: string;
  year: number;
  playbackId: string;
  burst: number;
  media: MediaItem[];
};

export async function seedDummyMediaData(): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    // Clear existing data to avoid duplicates
    console.log('Clearing existing Media Sufficiency data...');
    await prisma.campaignMedia.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.mediaSubtype.deleteMany({});
    await prisma.mediaType.deleteMany({});
    await prisma.range.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.mSCountry.deleteMany({});
    await prisma.subRegion.deleteMany({});
    
    console.log('Database cleared successfully.');
    console.log('Seeding dummy Media Sufficiency data...');

    // Create SubRegions
    const subRegions = [
      { name: 'ANZ' },
      { name: 'APAC' },
      { name: 'Europe' },
      { name: 'North America' },
      { name: 'LATAM' },
      { name: 'MENAT' },
      { name: 'AME' },
      { name: 'ASEAN' },
      { name: 'INDIA' },
      { name: 'BRAZIL' },
      { name: 'MEXICO' },
      { name: 'COLOMBIA' },
      { name: 'CHILE' },
      { name: 'PERU' },
      { name: 'TURKEY' },
      { name: 'RSA' }
    ];
    
    const subRegionMap = new Map();
    for (const data of subRegions) {
      const subRegion = await prisma.subRegion.upsert({
        where: { name: data.name },
        update: {},
        create: { name: data.name }
      });
      subRegionMap.set(data.name, subRegion.id);
      console.log(`Created SubRegion: ${data.name}`);
    }

    // Create Countries
    const countries = [
      { name: 'Australia', subRegion: 'ANZ', cluster: 'India + ANZ' },
      { name: 'New Zealand', subRegion: 'ANZ', cluster: 'India + ANZ' },
      { name: 'Singapore', subRegion: 'ASEAN', cluster: 'SEA' },
      { name: 'Malaysia', subRegion: 'ASEAN', cluster: 'SEA' },
      { name: 'Thailand', subRegion: 'ASEAN', cluster: 'SEA' },
      { name: 'Vietnam', subRegion: 'ASEAN', cluster: 'SEA' },
      { name: 'Indonesia', subRegion: 'ASEAN', cluster: 'SEA' },
      { name: 'Germany', subRegion: 'Europe', cluster: 'DACH' },
      { name: 'France', subRegion: 'Europe', cluster: 'Western Europe' },
      { name: 'USA', subRegion: 'North America', cluster: 'NA' },
      { name: 'Brazil', subRegion: 'BRAZIL', cluster: 'LATAM' },
      { name: 'Mexico', subRegion: 'MEXICO', cluster: 'LATAM' },
      { name: 'Colombia', subRegion: 'COLOMBIA', cluster: 'LATAM' },
      { name: 'Chile', subRegion: 'CHILE', cluster: 'LATAM' },
      { name: 'Peru', subRegion: 'PERU', cluster: 'LATAM' },
      { name: 'Egypt', subRegion: 'MENAT', cluster: 'MENAT' },
      { name: 'Morocco', subRegion: 'MENAT', cluster: 'North Africa' },
      { name: 'Turkey', subRegion: 'TURKEY', cluster: 'MENAT' },
      { name: 'India', subRegion: 'INDIA', cluster: 'India + ANZ' },
      { name: 'South Africa', subRegion: 'RSA', cluster: 'AME' }
    ];
    
    const countryMap = new Map();
    for (const data of countries) {
      const subRegionId = subRegionMap.get(data.subRegion);
      if (!subRegionId) continue;
      
      const country = await prisma.mSCountry.upsert({
        where: { name: data.name },
        update: {},
        create: {
          name: data.name,
          subRegionId,
          cluster: data.cluster
        }
      });
      countryMap.set(data.name, country.id);
      console.log(`Created Country: ${data.name} in SubRegion: ${data.subRegion}`);
    }

    // Create Categories
    const categories = [
      'Deo',
      'Face Care',
      'Body Care',
      'Hair Care',
      'Sun Care',
      'Lip Care',
      'Shower',
      'Men Care',
      'Hand Care',
      'Baby Care'
    ];
    
    const categoryMap = new Map();
    for (const name of categories) {
      const category = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      categoryMap.set(name, category.id);
      console.log(`Created Category: ${name}`);
    }

    // Create Ranges
    const ranges = [
      { name: 'Black & White', category: 'Deo' },
      { name: 'Deep', category: 'Deo' },
      { name: 'Derma Control', category: 'Deo' },
      { name: 'Pearl & Beauty', category: 'Deo' },
      { name: 'Fresh', category: 'Deo' },
      { name: 'Dry Comfort', category: 'Deo' },
      { name: 'Cellular', category: 'Face Care' },
      { name: 'Q10', category: 'Face Care' },
      { name: 'Aqua Sensation', category: 'Face Care' },
      { name: 'Naturally Good', category: 'Face Care' },
      { name: 'Hydra IQ', category: 'Body Care' },
      { name: 'Cocoa Butter', category: 'Body Care' },
      { name: 'Soft', category: 'Body Care' },
      { name: 'Repair & Care', category: 'Hair Care' },
      { name: 'Volume & Strength', category: 'Hair Care' },
      { name: 'Color Protect', category: 'Hair Care' },
      { name: 'UV Protection', category: 'Sun Care' },
      { name: 'After Sun', category: 'Sun Care' },
      { name: 'Kids Protection', category: 'Sun Care' },
      { name: 'Original', category: 'Lip Care' },
      { name: 'Fruity Shine', category: 'Lip Care' },
      { name: 'Cream Care', category: 'Shower' },
      { name: 'Fresh', category: 'Shower' },
      { name: 'Sensitive', category: 'Men Care' },
      { name: 'Active Energy', category: 'Men Care' },
      { name: 'Intensive', category: 'Hand Care' },
      { name: 'Soft Wash', category: 'Baby Care' },
      { name: 'Sensitive', category: 'Baby Care' }
    ];
    
    const rangeMap = new Map();
    for (const data of ranges) {
      const categoryId = categoryMap.get(data.category);
      if (!categoryId) continue;
      
      const range = await prisma.range.upsert({
        where: {
          name_categoryId: {
            name: data.name,
            categoryId
          }
        },
        update: {},
        create: {
          name: data.name,
          categoryId
        }
      });
      rangeMap.set(`${data.name}_${data.category}`, range.id);
      console.log(`Created Range: ${data.name} for Category: ${data.category}`);
    }

    // Create Media Types
    const mediaTypes = [
      'Digital',
      'TV',
      'OOH',
      'Radio',
      'Print',
      'Traditional'
    ];
    
    const mediaTypeMap = new Map();
    for (const name of mediaTypes) {
      const mediaType = await prisma.mediaType.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      mediaTypeMap.set(name, mediaType.id);
      console.log(`Created Media Type: ${name}`);
    }

    // Create Media Subtypes
    const mediaSubtypes = [
      { name: 'PM & FF', mediaType: 'Digital' },
      { name: 'Influencers', mediaType: 'Digital' },
      { name: 'Influencers Amplification', mediaType: 'Digital' },
      { name: 'Influencers Organic', mediaType: 'Digital' },
      { name: 'Social Media', mediaType: 'Digital' },
      { name: 'Search', mediaType: 'Digital' },
      { name: 'Other Digital', mediaType: 'Digital' },
      { name: 'Open TV', mediaType: 'TV' },
      { name: 'Paid TV', mediaType: 'TV' },
      { name: 'Cable TV', mediaType: 'TV' },
      { name: 'OOH', mediaType: 'OOH' },
      { name: 'Billboards', mediaType: 'OOH' },
      { name: 'Transit', mediaType: 'OOH' },
      { name: 'AM/FM', mediaType: 'Radio' },
      { name: 'Podcasts', mediaType: 'Radio' },
      { name: 'Print', mediaType: 'Print' },
      { name: 'Magazines', mediaType: 'Print' },
      { name: 'Newspapers', mediaType: 'Print' },
      { name: 'Mixed', mediaType: 'Traditional' }
    ];
    
    const mediaSubtypeMap = new Map();
    for (const data of mediaSubtypes) {
      const mediaTypeId = mediaTypeMap.get(data.mediaType);
      if (!mediaTypeId) continue;
      
      const mediaSubtype = await prisma.mediaSubtype.upsert({
        where: {
          name_mediaTypeId: {
            name: data.name,
            mediaTypeId
          }
        },
        update: {},
        create: {
          name: data.name,
          mediaTypeId
        }
      });
      mediaSubtypeMap.set(`${data.name}_${data.mediaType}`, mediaSubtype.id);
      console.log(`Created Media Subtype: ${data.name} for Media Type: ${data.mediaType}`);
    }

    // Generate a larger set of campaigns with more variety
    // We'll create 50 campaigns across different countries, categories, and ranges
    const campaignTemplates = [
      {
        name: 'Black & White',
        range: 'Black & White',
        category: 'Deo',
        country: 'Australia',
        year: 2025,
        playbackId: 'GL005',
        burst: 1,
        media: [
          {
            mediaType: 'Digital',
            mediaSubtype: 'PM & FF',
            startDate: '2025-02-01',
            endDate: '2025-04-30',
            totalBudget: 428,
            q1Budget: 286,
            q2Budget: 143,
            q3Budget: 0,
            q4Budget: 0
          },
          {
            mediaType: 'Digital',
            mediaSubtype: 'Influencers',
            startDate: '2025-02-01',
            endDate: '2025-04-30',
            totalBudget: 67,
            q1Budget: 45,
            q2Budget: 22,
            q3Budget: 0,
            q4Budget: 0
          }
        ]
      },
      {
        name: 'Deep',
        range: 'Deep',
        category: 'Deo',
        country: 'Australia',
        year: 2025,
        playbackId: 'EM019',
        burst: 1,
        media: [
          {
            mediaType: 'Digital',
            mediaSubtype: 'PM & FF',
            startDate: '2025-03-01',
            endDate: '2025-04-30',
            totalBudget: 110,
            q1Budget: 55,
            q2Budget: 55,
            q3Budget: 0,
            q4Budget: 0
          }
        ]
      },
      {
        name: 'Derma Control',
        range: 'Derma Control',
        category: 'Deo',
        country: 'Australia',
        year: 2025,
        playbackId: 'EM015',
        burst: 1,
        media: [
          {
            mediaType: 'TV',
            mediaSubtype: 'Open TV',
            startDate: '2025-09-01',
            endDate: '2025-10-30',
            totalBudget: 337,
            q1Budget: 0,
            q2Budget: 0,
            q3Budget: 168,
            q4Budget: 168
          },
          {
            mediaType: 'Digital',
            mediaSubtype: 'PM & FF',
            startDate: '2025-08-01',
            endDate: '2025-11-30',
            totalBudget: 459,
            q1Budget: 0,
            q2Budget: 0,
            q3Budget: 230,
            q4Budget: 230
          }
        ]
      },
      {
        name: 'Pearl & Beauty',
        range: 'Pearl & Beauty',
        category: 'Deo',
        country: 'Australia',
        year: 2025,
        playbackId: 'EM035',
        burst: 1,
        media: [
          {
            mediaType: 'Digital',
            mediaSubtype: 'PM & FF',
            startDate: '2025-05-01',
            endDate: '2025-07-30',
            totalBudget: 245,
            q1Budget: 0,
            q2Budget: 163,
            q3Budget: 82,
            q4Budget: 0
          }
        ]
      },
      {
        name: 'Cellular Filler',
        range: 'Cellular',
        category: 'Face Care',
        country: 'Australia',
        year: 2025,
        playbackId: 'GL079',
        burst: 1,
        media: [
          {
            mediaType: 'TV',
            mediaSubtype: 'Open TV',
            startDate: '2025-04-01',
            endDate: '2025-05-30',
            totalBudget: 323,
            q1Budget: 0,
            q2Budget: 323,
            q3Budget: 0,
            q4Budget: 0
          }
        ]
      },
      // Add some data for other countries
      {
        name: 'Black & White',
        range: 'Black & White',
        category: 'Deo',
        country: 'Germany',
        year: 2025,
        playbackId: 'GL005',
        burst: 1,
        media: [
          {
            mediaType: 'Digital',
            mediaSubtype: 'PM & FF',
            startDate: '2025-02-01',
            endDate: '2025-04-30',
            totalBudget: 650,
            q1Budget: 400,
            q2Budget: 250,
            q3Budget: 0,
            q4Budget: 0
          },
          {
            mediaType: 'TV',
            mediaSubtype: 'Open TV',
            startDate: '2025-03-01',
            endDate: '2025-05-30',
            totalBudget: 800,
            q1Budget: 300,
            q2Budget: 500,
            q3Budget: 0,
            q4Budget: 0
          }
        ]
      },
      {
        name: 'Q10 Anti-Aging',
        range: 'Q10',
        category: 'Face Care',
        country: 'Germany',
        year: 2025,
        playbackId: 'FC001',
        burst: 1,
        media: [
          {
            mediaType: 'Digital',
            mediaSubtype: 'Social Media',
            startDate: '2025-06-01',
            endDate: '2025-08-30',
            totalBudget: 420,
            q1Budget: 0,
            q2Budget: 200,
            q3Budget: 220,
            q4Budget: 0
          },
          {
            mediaType: 'Print',
            mediaSubtype: 'Magazines',
            startDate: '2025-07-01',
            endDate: '2025-09-30',
            totalBudget: 180,
            q1Budget: 0,
            q2Budget: 60,
            q3Budget: 120,
            q4Budget: 0
          }
        ]
      }
    ];
    
    // Generate 50 campaigns with varied data
    const generatedCampaigns = [];
    const years = [2024, 2025, 2026];
    const playbackIdPrefixes = ['GL', 'EM', 'FC', 'BC', 'HC', 'SC'];
    const burstValues = [1, 2, 3];
    
    // Get all available countries, ranges, and media subtypes
    const availableCountries = Array.from(countryMap.keys());
    const availableRanges = Array.from(rangeMap.keys());
    const availableMediaSubtypes = Array.from(mediaSubtypeMap.keys());
    
    // Generate 50 unique campaigns
    for (let i = 0; i < 50; i++) {
      // Select random values for campaign attributes
      const year = getRandomItem(years);
      const country = getRandomItem(availableCountries);
      const rangeKey = getRandomItem(availableRanges);
      const [rangeName, categoryName] = rangeKey.split('_');
      const burst = getRandomItem(burstValues);
      const playbackIdPrefix = getRandomItem(playbackIdPrefixes);
      const playbackIdNumber = getRandomInt(1, 999).toString().padStart(3, '0');
      const playbackId = `${playbackIdPrefix}${playbackIdNumber}`;
      
      // Create campaign name (sometimes same as range, sometimes with a suffix)
      const campaignName = Math.random() > 0.3 ? 
        rangeName : 
        `${rangeName} ${['Refresh', 'Relaunch', 'Special', 'New', 'Premium'][Math.floor(Math.random() * 5)]}`;
      
      // Generate 1-3 media items for this campaign
      const mediaCount = getRandomInt(1, 3);
      const mediaItems = [];
      
      for (let j = 0; j < mediaCount; j++) {
        // Select random media subtype
        const mediaSubtypeKey = getRandomItem(availableMediaSubtypes);
        const [subtypeName, mediaTypeName] = mediaSubtypeKey.split('_');
        
        // Generate random dates within the year
        const startMonth = getRandomInt(0, 11);
        const startDate = new Date(year, startMonth, getRandomInt(1, 28));
        const durationMonths = getRandomInt(1, 6);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + durationMonths);
        
        // Generate random budget between 50k and 1M
        const totalBudget = getRandomFloat(50, 1000);
        
        // Calculate quarterly budget distribution
        const { q1, q2, q3, q4 } = calculateQuarterBudget(startDate, endDate, totalBudget);
        
        // Ensure totalBudget is exactly the sum of quarterly budgets
        const calculatedTotalBudget = q1 + q2 + q3 + q4;
        
        // Add reach and TRPs for TV campaigns
        const trps = mediaTypeName === 'TV' ? getRandomFloat(50, 500) : null;
        const reach1Plus = mediaTypeName === 'TV' ? getRandomFloat(30, 90) : null;
        const reach3Plus = mediaTypeName === 'TV' ? getRandomFloat(10, 50) : null;
        
        mediaItems.push({
          mediaType: mediaTypeName,
          mediaSubtype: subtypeName,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalBudget: calculatedTotalBudget,
          q1Budget: q1,
          q2Budget: q2,
          q3Budget: q3,
          q4Budget: q4,
          trps,
          reach1Plus,
          reach3Plus
        });
      }
      
      // Add campaign to generated list
      generatedCampaigns.push({
        name: campaignName,
        range: rangeName,
        category: categoryName,
        country,
        year,
        playbackId,
        burst,
        media: mediaItems
      });
    }
    
    // Update template campaigns to ensure all media items have the same structure
    for (const campaign of campaignTemplates) {
      for (const mediaItem of campaign.media) {
        // Add missing properties with null values if they don't exist
        if (!('trps' in mediaItem)) (mediaItem as any).trps = null;
        if (!('reach1Plus' in mediaItem)) (mediaItem as any).reach1Plus = null;
        if (!('reach3Plus' in mediaItem)) (mediaItem as any).reach3Plus = null;
        
        // Ensure totalBudget is exactly the sum of quarterly budgets
        mediaItem.totalBudget = mediaItem.q1Budget + mediaItem.q2Budget + mediaItem.q3Budget + mediaItem.q4Budget;
      }
    }

    // Create campaigns and their media
    for (const campaignData of [...campaignTemplates, ...generatedCampaigns]) {
      const countryId = countryMap.get(campaignData.country);
      const rangeKey = `${campaignData.range}_${campaignData.category}`;
      const rangeId = rangeMap.get(rangeKey);
      
      if (!countryId || !rangeId) {
        console.log(`Skipping campaign ${campaignData.name} due to missing country or range`);
        continue;
      }
      
      // Create campaign
      const campaign = await prisma.campaign.upsert({
        where: {
          name_rangeId_countryId_year_burst: {
            name: campaignData.name,
            rangeId,
            countryId,
            year: campaignData.year,
            burst: campaignData.burst
          }
        },
        update: {},
        create: {
          name: campaignData.name,
          rangeId,
          countryId,
          year: campaignData.year,
          playbackId: campaignData.playbackId,
          burst: campaignData.burst
        }
      });
      
      // Create campaign media
      for (const mediaData of campaignData.media) {
        const mediaSubtypeKey = `${mediaData.mediaSubtype}_${mediaData.mediaType}`;
        const mediaSubtypeId = mediaSubtypeMap.get(mediaSubtypeKey);
        
        if (!mediaSubtypeId) {
          console.log(`Skipping media ${mediaData.mediaSubtype} for campaign ${campaignData.name} due to missing media subtype`);
          continue;
        }
        
        // Ensure totalBudget is exactly the sum of quarterly budgets
        const totalBudget = mediaData.q1Budget + mediaData.q2Budget + mediaData.q3Budget + mediaData.q4Budget;
        
        await prisma.campaignMedia.create({
          data: {
            campaignId: campaign.id,
            mediaSubtypeId,
            startDate: new Date(mediaData.startDate),
            endDate: new Date(mediaData.endDate),
            totalBudget: totalBudget,
            q1Budget: mediaData.q1Budget,
            q2Budget: mediaData.q2Budget,
            q3Budget: mediaData.q3Budget,
            q4Budget: mediaData.q4Budget,
            trps: (mediaData as any).trps !== undefined ? (mediaData as any).trps : null,
            reach1Plus: (mediaData as any).reach1Plus !== undefined ? (mediaData as any).reach1Plus : null,
            reach3Plus: (mediaData as any).reach3Plus !== undefined ? (mediaData as any).reach3Plus : null
          }
        });
      }
    }
    
    // Count records in database to verify seeding
    const campaignCount = await prisma.campaign.count();
    const campaignMediaCount = await prisma.campaignMedia.count();
    const categoryCount = await prisma.category.count();
    const rangeCount = await prisma.range.count();
    const countryCount = await prisma.mSCountry.count();
    const subRegionCount = await prisma.subRegion.count();
    const mediaTypeCount = await prisma.mediaType.count();
    const mediaSubtypeCount = await prisma.mediaSubtype.count();
    
    console.log('Database record counts after seeding:');
    console.log(`- Campaigns: ${campaignCount}`);
    console.log(`- Campaign Media Items: ${campaignMediaCount}`);
    console.log(`- Categories: ${categoryCount}`);
    console.log(`- Ranges: ${rangeCount}`);
    console.log(`- Countries: ${countryCount}`);
    console.log(`- SubRegions: ${subRegionCount}`);
    console.log(`- Media Types: ${mediaTypeCount}`);
    console.log(`- Media Subtypes: ${mediaSubtypeCount}`);
    
    console.log('Comprehensive dummy Media Sufficiency data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding dummy Media Sufficiency data:', error);
    throw error;
  }
}
