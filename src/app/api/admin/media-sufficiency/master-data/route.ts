import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getUserFromRequest, filterCountriesByAccess } from '@/lib/auth/countryAccess';

const prisma = new PrismaClient();

// Path to the static master data file for fallback
const MASTER_DATA_PATH = path.resolve('./src/lib/validation/masterData.json');

export async function GET(request: NextRequest) {
  try {
    console.log('Master data API endpoint called - fetching from database');
    
    // Get user access information
    const userAccess = await getUserFromRequest(request);
    console.log('User access:', userAccess);
    
    // Fetch countries based on user access
    let countries;
    if (userAccess) {
      countries = await filterCountriesByAccess(userAccess);
      console.log(`Filtered countries for user (role: ${userAccess.role}): ${countries.length} countries`);
    } else {
      // If no user access info, fetch all countries (fallback)
      countries = await prisma.country.findMany({
        include: {
          subRegion: true,
          region: true,
          cluster: true
        }
      });
      console.log('No user access info - fetching all countries:', countries.length);
    }
    
    // Fetch other master data (not filtered by user)
    const [
      subRegions,
      categories,
      ranges,
      categoryToRangeRelations,
      mediaTypes,
      mediaSubTypes,
      campaigns,
      pmTypes,
      campaignArchetypes
    ] = await Promise.all([
      prisma.subRegion.findMany(),
      prisma.category.findMany(),
      prisma.range.findMany(),
      prisma.categoryToRange.findMany({
        include: {
          category: true,
          range: true
        }
      }),
      prisma.mediaType.findMany(),
      prisma.mediaSubType.findMany({
        include: {
          mediaType: true
        }
      }),
      prisma.campaign.findMany({
        include: {
          range: true
        }
      }),
      prisma.pMType.findMany(),
      prisma.campaignArchetype.findMany()
    ]);

    console.log(`Fetched data from database: ${countries.length} countries, ${subRegions.length} sub-regions, ${categories.length} categories, ${ranges.length} ranges`);

    // Build country mappings
    const countryNames = countries.map(c => c.name);
    const subRegionNames = subRegions.map(sr => sr.name);
    
    // Create country to sub-region mapping
    const countryToSubRegionMap: Record<string, string> = {};
    const subRegionToCountriesMap: Record<string, string[]> = {};
    
    countries.forEach(country => {
      if (country.subRegion) {
        countryToSubRegionMap[country.name] = country.subRegion.name;
        
        if (!subRegionToCountriesMap[country.subRegion.name]) {
          subRegionToCountriesMap[country.subRegion.name] = [];
        }
        subRegionToCountriesMap[country.subRegion.name].push(country.name);
      }
    });

    // Build category-range mappings
    const categoryToRanges: Record<string, string[]> = {};
    const rangeToCategories: Record<string, string[]> = {};
    
    categoryToRangeRelations.forEach(relation => {
      const categoryName = relation.category.name;
      const rangeName = relation.range.name;
      
      // Category to ranges mapping
      if (!categoryToRanges[categoryName]) {
        categoryToRanges[categoryName] = [];
      }
      if (!categoryToRanges[categoryName].includes(rangeName)) {
        categoryToRanges[categoryName].push(rangeName);
      }
      
      // Range to categories mapping
      if (!rangeToCategories[rangeName]) {
        rangeToCategories[rangeName] = [];
      }
      if (!rangeToCategories[rangeName].includes(categoryName)) {
        rangeToCategories[rangeName].push(categoryName);
      }
    });

    // Build campaign-range mappings (including many-to-many from junction table)
    const campaignToRangeMap: Record<string, string> = {};
    const rangeToCampaignsMap: Record<string, string[]> = {};
    
    // First, add direct range relationships
    campaigns.forEach(campaign => {
      if (campaign.range) {
        campaignToRangeMap[campaign.name] = campaign.range.name;
        
        if (!rangeToCampaignsMap[campaign.range.name]) {
          rangeToCampaignsMap[campaign.range.name] = [];
        }
        if (!rangeToCampaignsMap[campaign.range.name].includes(campaign.name)) {
          rangeToCampaignsMap[campaign.range.name].push(campaign.name);
        }
      }
    });
    
    // Then, add many-to-many relationships from junction table
    try {
      const rangeToCampaignJunctions = await prisma.rangeToCampaign.findMany({
        include: {
          range: true,
          campaign: true
        }
      });
      
      rangeToCampaignJunctions.forEach(junction => {
        // Additional null checks for safety
        if (junction.range && junction.campaign && junction.range.name && junction.campaign.name) {
          const rangeName = junction.range.name;
          const campaignName = junction.campaign.name;
          
          if (!rangeToCampaignsMap[rangeName]) {
            rangeToCampaignsMap[rangeName] = [];
          }
          if (!rangeToCampaignsMap[rangeName].includes(campaignName)) {
            rangeToCampaignsMap[rangeName].push(campaignName);
          }
        }
      });
      
      console.log(`Added ${rangeToCampaignJunctions.length} many-to-many campaign relationships`);
    } catch (error) {
      console.warn('Could not load many-to-many campaign relationships:', error);
    }

    // Build media type to subtypes mapping
    const mediaToSubtypes: Record<string, string[]> = {};
    
    mediaSubTypes.forEach(subType => {
      if (subType.mediaType) {
        const mediaTypeName = subType.mediaType.name;
        
        if (!mediaToSubtypes[mediaTypeName]) {
          mediaToSubtypes[mediaTypeName] = [];
        }
        if (!mediaToSubtypes[mediaTypeName].includes(subType.name)) {
          mediaToSubtypes[mediaTypeName].push(subType.name);
        }
      }
    });

    // Load campaign compatibility mappings from static file
    let campaignCompatibilityMap = {};
    let rangeCompatibleCampaigns = {};
    
    try {
      const staticMasterDataPath = path.resolve('./src/lib/validation/masterData.json');
      if (fs.existsSync(staticMasterDataPath)) {
        const staticData = JSON.parse(fs.readFileSync(staticMasterDataPath, 'utf-8'));
        campaignCompatibilityMap = staticData.campaignCompatibilityMap || {};
        rangeCompatibleCampaigns = staticData.rangeCompatibleCampaigns || {};
      }
    } catch (error) {
      console.warn('Could not load campaign compatibility mappings from static file:', error);
    }

    // Create the complete master data object
    const masterData = {
      // Country and region data
      countries: countryNames,
      subRegions: subRegionNames,
      countryToSubRegionMap,
      subRegionToCountriesMap,
      
      // Category and range data
      categories: categories.map(c => c.name),
      ranges: ranges.map(r => r.name),
      categoryToRanges,
      rangeToCategories,
      
      // Campaign data
      campaigns: campaigns.map(c => c.name),
      campaignToRangeMap,
      rangeToCampaignsMap,
      
      // Campaign compatibility for multi-range support
      campaignCompatibilityMap,
      rangeCompatibleCampaigns,
      
      // Media data
      mediaTypes: mediaTypes.map(mt => mt.name),
      mediaSubTypes: mediaSubTypes.map(mst => mst.name),
      mediaToSubtypes,
      
      // PM Types
      pmTypes: pmTypes.map(pt => pt.name),
      
      // Campaign Archetypes
      campaignArchetypes: campaignArchetypes.map(ca => ca.name),
      
      // Raw records for compatibility
      records: []
    };

    console.log('Master data compiled from database successfully');
    console.log(`Country mappings: ${Object.keys(countryToSubRegionMap).length} countries mapped to sub-regions`);
    console.log(`Category mappings: ${Object.keys(categoryToRanges).length} categories with ranges`);
    console.log(`Campaign mappings: ${Object.keys(campaignToRangeMap).length} campaigns mapped to ranges`);
    console.log(`Media mappings: ${Object.keys(mediaToSubtypes).length} media types with subtypes`);

    return NextResponse.json(masterData);
    
  } catch (error) {
    console.error('Error fetching master data from database:', error);
    
    // Fallback to static file if database fails
    try {
      if (fs.existsSync(MASTER_DATA_PATH)) {
        console.log('Falling back to static master data file');
        const masterDataContent = fs.readFileSync(MASTER_DATA_PATH, 'utf-8');
        const masterData = JSON.parse(masterDataContent);
        
        // Add empty arrays for missing database-specific fields
        if (!masterData.countries) masterData.countries = [];
        if (!masterData.countryToSubRegionMap) masterData.countryToSubRegionMap = {};
        if (!masterData.subRegionToCountriesMap) masterData.subRegionToCountriesMap = {};
        if (!masterData.campaignToRangeMap) masterData.campaignToRangeMap = {};
        if (!masterData.rangeToCampaignsMap) masterData.rangeToCampaignsMap = {};
        if (!masterData.mediaToSubtypes) masterData.mediaToSubtypes = {};
        
        return NextResponse.json(masterData);
      }
    } catch (fallbackError) {
      console.error('Error reading fallback master data:', fallbackError);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch master data from database and no fallback available' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
