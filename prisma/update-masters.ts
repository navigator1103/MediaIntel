import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Master data from DataProcessing app

// Campaign names master list
const CAMPAIGN_NAMES = [
  'Cellular Filler',
  'Cellular Lift',
  'Genes',
  'Cellular Bakuchiol',
  'Cellular Cushion',
  'Epigenetics',
  'Q10 Range',
  'Q10 Guardian',
  'Q10 Skin Diet',
  '50 Shades',
  'Lucia',
  'Sirena',
  'Luminous Launch',
  'Even Glow',
  'Pearls',
  'Skin Gift',
  'Papaya',
  'Body Milk 5 in 1',
  'Creme',
  'Polaris',
  'In Body',
  'Repair & Care',
  'Body Aloe Summer',
  'Soft',
  'Soft UV',
  'C&E Trio',
  'Super 10',
  'Super 4 Core',
  'Even Tone Core',
  'Natural Glow',
  'Deep + Cat',
  'Radiant Beauty',
  'Ozono',
  'Daily Essentials',
  'Micellar Core',
  'Micellar Siri',
  'Micellar Pearl Bright',
  'Micellar Melange',
  'Micellar Siri 2.0',
  'Radiant Skin Clear',
  'Acne Control',
  'Luminous Foam',
  'Protect & Moisture',
  'UV Face',
  'UV Face Fluid',
  'UV Face Fluid Tinted',
  'Sun Range',
  'C&E',
  'Korea',
  'UV Specialist',
  'Deep Cleansing',
  'Sensitive Moisture',
  'DSR Range',
  'Extra Bright Starwalker',
  'Bright Oil Clear',
  'Black & White',
  'Black & White Male',
  'Black & White Female',
  'Deep',
  'Deep Espresso',
  'Pearl & Beauty',
  'Derma Control',
  'Clinical',
  'Deo Male',
  'Cool Kick',
  'Extra Bright',
  'Fresh',
  'Hijab Fresh',
  'Skin Hero',
  'Lip',
  'Disney',
  'Hyaluron',
  'Search AWON',
  'Social AWON'
];
const MEDIA_TYPES = {
  'Digital': 1,
  'TV': 2,
  'OOH': 3,
  'Traditional': 4
};

const COUNTRIES = {
  'Australia': 1,
  'Brazil': 2,
  'Centroamerica': 3,
  'Chile': 4,
  'Colombia': 5,
  'Ecuador': 6,
  'Egypt': 7,
  'India': 8,
  'Indonesia': 9,
  'Malaysia': 10,
  'Mexico': 11,
  'Middle East': 12,
  'Morocco': 13,
  'North Africa': 14,
  'Peru': 15,
  'Singapore': 16,
  'South Africa': 17,
  'Thailand': 18,
  'Turkey': 19,
  'Vietnam': 20
};

const MEDIA_SUBTYPES = {
  'PM & FF': 1,
  'Influencers': 2,
  'Influencers Amplification': 3,
  'Influencers Organic': 4,
  'OOH': 5,
  'Open TV': 6,
  'Other Digital': 7,
  'Paid TV': 8,
  'Print': 9,
  'Radio': 10,
  'Search': 11
};

const PM_TYPES = {
  'GR Only': 1,
  'PM Advanced': 2,
  'Full Funnel Basic': 3,
  'Full Funnel Advanced': 4,
  'Non PM': 5
};

const SUB_REGIONS = {
  'APAC': 1,
  'ASEAN': 2,
  'LATAM': 3,
  'MENAT': 4,
  'INDIA': 5,
  'BRAZIL': 6,
  'CHILE': 7,
  'COLOMBIA': 8,
  'ECUADOR': 9,
  'MEXICO': 10,
  'PERU': 11,
  'RSA': 12,
  'TURKEY': 13
};

const BUSINESS_UNITS = {
  'Nivea': 1,
  'Derma': 2
};

const CLUSTERS = {
  'AME': 1,
  'ANZ': 2,
  'ASEAN': 3,
  'BRAZIL': 4,
  'CHILE': 5,
  'COLOMBIA': 6,
  'ECUADOR': 7,
  'INDIA': 8,
  'India + ANZ': 9,
  'LATAM': 10,
  'MENAT': 11,
  'MEXICO': 12,
  'PERU': 13,
  'RSA': 14,
  'TURKEY': 15
};

// Country to SubRegion mapping
const COUNTRY_SUBREGIONS: Record<string, string> = {
  'Australia': 'APAC',
  'Brazil': 'LATAM',
  'Centroamerica': 'LATAM',
  'Chile': 'LATAM',
  'Colombia': 'LATAM',
  'Ecuador': 'LATAM',
  'Egypt': 'MENAT',
  'India': 'INDIA',
  'Indonesia': 'ASEAN',
  'Malaysia': 'ASEAN',
  'Mexico': 'LATAM',
  'Middle East': 'MENAT',
  'Morocco': 'MENAT',
  'North Africa': 'MENAT',
  'Peru': 'LATAM',
  'Singapore': 'ASEAN',
  'South Africa': 'RSA',
  'Thailand': 'ASEAN',
  'Turkey': 'TURKEY',
  'Vietnam': 'ASEAN'
};

// Media Subtype to Media Type mapping
const SUBTYPE_TO_MEDIATYPE: Record<string, string> = {
  'PM & FF': 'Digital',
  'Influencers': 'Digital',
  'Influencers Amplification': 'Digital',
  'Influencers Organic': 'Digital',
  'OOH': 'OOH',
  'Open TV': 'TV',
  'Other Digital': 'Digital',
  'Paid TV': 'TV',
  'Print': 'Traditional',
  'Radio': 'Traditional',
  'Search': 'Digital'
};

// Categories
const CATEGORIES = [
  'Deo',
  'Face Care',
  'Face Cleansing',
  'Hand Body',
  'Sun',
  'Man',
  'Lip',
  'X-Cat'
];

// Ranges with their categories
const RANGES = [
  { name: 'Cellular', category: 'Face Care' },
  { name: 'Epigenetics', category: 'Face Care' },
  { name: 'Q10', category: 'Face Care' },
  { name: 'Luminous 630', category: 'Face Care' },
  { name: 'Rose Care', category: 'Face Care' },
  { name: 'Facial', category: 'Face Cleansing' },
  { name: 'Milk', category: 'Face Cleansing' },
  { name: 'Creme', category: 'Hand Body' },
  { name: 'Repair & Care', category: 'Hand Body' },
  { name: 'Aloe', category: 'Hand Body' },
  { name: 'Soft', category: 'Hand Body' },
  { name: 'Vitamin Serum', category: 'Face Care' },
  { name: 'Vitamin Range', category: 'Face Care' },
  { name: 'Even Tone Core', category: 'Face Care' },
  { name: 'Natural Glow', category: 'Face Care' },
  { name: 'Deep', category: 'Face Care' },
  { name: 'Radiant Beauty', category: 'Face Care' },
  { name: 'Ozono', category: 'Face Care' },
  { name: 'Daily Essentials', category: 'Face Care' },
  { name: 'Micellar', category: 'Face Cleansing' },
  { name: 'Acne', category: 'Face Care' },
  { name: 'Protect & Moisture', category: 'Face Care' },
  { name: 'UV Face', category: 'Sun' },
  { name: 'Sun', category: 'Sun' },
  { name: 'Sensitive', category: 'Face Care' },
  { name: 'Men', category: 'Man' },
  { name: 'Extra Bright', category: 'Face Care' },
  { name: 'Black & White', category: 'Deo' },
  { name: 'Pearl & Beauty', category: 'Deo' },
  { name: 'Clinical', category: 'Deo' },
  { name: 'Deo Male', category: 'Deo' },
  { name: 'Cool Kick', category: 'Deo' },
  { name: 'Even Tone', category: 'Deo' },
  { name: 'Fresh', category: 'Deo' },
  { name: 'Hijab Fresh', category: 'Deo' },
  { name: 'Skin Hero', category: 'Deo' },
  { name: 'Lip', category: 'Lip' },
  { name: 'All', category: 'X-Cat' }
];

async function main() {
  console.log('Starting to update master data...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await clearExistingData();
    
    // First, update the main application tables
    console.log('Updating main application tables...');
    await updateMainApplicationTables();

    // Add SubRegions
    console.log('Adding SubRegions...');
    const subRegionMap = new Map();
    for (const [name, id] of Object.entries(SUB_REGIONS)) {
      const subRegion = await prisma.subRegion.create({
        data: {
          name
        }
      });
      subRegionMap.set(name, subRegion.id);
    }

    // Add Clusters
    console.log('Adding Clusters...');
    const clusterMap = new Map();
    for (const [name, id] of Object.entries(CLUSTERS)) {
      const cluster = await prisma.cluster.create({
        data: {
          name
        }
      });
      clusterMap.set(name, cluster.id);
    }

    // Add Countries
    console.log('Adding Countries...');
    const countryMap = new Map();
    for (const [name, id] of Object.entries(COUNTRIES)) {
      const subRegionName = COUNTRY_SUBREGIONS[name];
      const subRegionId = subRegionMap.get(subRegionName);
      
      if (!subRegionId) {
        console.warn(`SubRegion not found for country ${name}`);
        continue;
      }

      const country = await prisma.mSCountry.create({
        data: {
          name,
          subRegionId,
          cluster: subRegionName // Using subRegion as cluster for now
        }
      });
      countryMap.set(name, country.id);
    }

    // Add Categories
    console.log('Adding Categories...');
    const categoryMap = new Map();
    for (const name of CATEGORIES) {
      const category = await prisma.category.create({
        data: {
          name
        }
      });
      categoryMap.set(name, category.id);
    }

    // Add Ranges
    console.log('Adding Ranges...');
    const rangeMap = new Map();
    for (const { name, category } of RANGES) {
      const categoryId = categoryMap.get(category);
      
      if (!categoryId) {
        console.warn(`Category not found for range ${name}`);
        continue;
      }

      const range = await prisma.range.create({
        data: {
          name,
          categoryId
        }
      });
      rangeMap.set(name, range.id);
    }

    // Add Media Types
    console.log('Adding Media Types...');
    const mediaTypeMap = new Map();
    for (const [name, id] of Object.entries(MEDIA_TYPES)) {
      const mediaType = await prisma.mediaType.create({
        data: {
          name
        }
      });
      mediaTypeMap.set(name, mediaType.id);
    }

    // Add Media Subtypes
    console.log('Adding Media Subtypes...');
    const mediaSubtypeMap = new Map();
    for (const [name, id] of Object.entries(MEDIA_SUBTYPES)) {
      const mediaTypeName = SUBTYPE_TO_MEDIATYPE[name];
      const mediaTypeId = mediaTypeMap.get(mediaTypeName);
      
      if (!mediaTypeId) {
        console.warn(`Media Type not found for subtype ${name}`);
        continue;
      }

      const mediaSubtype = await prisma.mediaSubtype.create({
        data: {
          name,
          mediaTypeId
        }
      });
      mediaSubtypeMap.set(name, mediaSubtype.id);
    }

    // Add PM Types
    console.log('Adding PM Types...');
    const pmTypeMap = new Map();
    for (const [name, id] of Object.entries(PM_TYPES)) {
      const pmType = await prisma.pMType.create({
        data: {
          name
        }
      });
      pmTypeMap.set(name, pmType.id);
    }

    // Add Business Units
    console.log('Adding Business Units...');
    const businessUnitMap = new Map();
    for (const [name, id] of Object.entries(BUSINESS_UNITS)) {
      const businessUnit = await prisma.businessUnit.create({
        data: {
          name
        }
      });
      businessUnitMap.set(name, businessUnit.id);
    }
    
    // Add Campaign Names as master data
    console.log('Adding Campaign Names...');
    for (const name of CAMPAIGN_NAMES) {
      await prisma.campaignName.create({
        data: {
          name
        }
      });
    }

    console.log('Master data update completed successfully!');
  } catch (error) {
    console.error('Error updating master data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function clearExistingData() {
  try {
    console.log('Clearing Media Sufficiency tables...');
    // Delete in reverse order of dependencies
    // Media Sufficiency tables
    await prisma.campaignMedia.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.campaignName.deleteMany({});
    await prisma.mediaSubtype.deleteMany({});
    await prisma.mediaType.deleteMany({});
    await prisma.range.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.mSCountry.deleteMany({});
    await prisma.subRegion.deleteMany({});
    await prisma.pMType.deleteMany({});
    await prisma.businessUnit.deleteMany({});
    await prisma.cluster.deleteMany({});
    
    console.log('Clearing main application tables...');
    // For the main application, we'll preserve existing data
    // and just add new entries or update existing ones
    // This avoids foreign key constraint issues
    
    // Instead of deleting, we'll check if entries exist and skip or update them
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

async function updateMainApplicationTables() {
  try {
    // Add Regions (equivalent to SubRegions in Media Sufficiency)
    console.log('Adding Regions to main application...');
    const regionMap = new Map();
    
    // First, get existing regions
    const existingRegions = await prisma.region.findMany();
    for (const region of existingRegions) {
      regionMap.set(region.name, region.id);
    }
    
    // Add new regions
    for (const [name, id] of Object.entries(SUB_REGIONS)) {
      if (!regionMap.has(name)) {
        const region = await prisma.region.upsert({
          where: { name },
          update: {},
          create: { name }
        });
        regionMap.set(name, region.id);
        console.log(`Added region: ${name}`);
      } else {
        console.log(`Region already exists: ${name}`);
      }
    }
    
    // Add Countries to main application
    console.log('Adding Countries to main application...');
    const existingCountries = await prisma.country.findMany();
    const existingCountryNames = existingCountries.map(c => c.name);
    
    for (const [name, id] of Object.entries(COUNTRIES)) {
      if (existingCountryNames.includes(name)) {
        console.log(`Country already exists: ${name}`);
        continue;
      }
      
      const subRegionName = COUNTRY_SUBREGIONS[name];
      const regionId = regionMap.get(subRegionName);
      
      if (!regionId) {
        console.warn(`Region not found for country ${name} in main application`);
        continue;
      }
      
      await prisma.country.create({
        data: {
          name,
          regionId
        }
      });
      console.log(`Added country: ${name}`);
    }
    
    // Add Brands (similar to Business Units in Media Sufficiency)
    console.log('Adding Brands to main application...');
    const existingBrands = await prisma.brand.findMany();
    const existingBrandNames = existingBrands.map(b => b.name);
    
    for (const [name, id] of Object.entries(BUSINESS_UNITS)) {
      if (existingBrandNames.includes(name)) {
        console.log(`Brand already exists: ${name}`);
        continue;
      }
      
      await prisma.brand.create({
        data: {
          name
        }
      });
      console.log(`Added brand: ${name}`);
    }
  } catch (error) {
    console.error('Error updating main application tables:', error);
  }
}

main()
  .then(() => {
    console.log('Done!');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
