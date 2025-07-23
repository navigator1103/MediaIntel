import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// We'll retrieve upload sessions from temporary file storage

export async function GET(request: NextRequest) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    // Get the session data from the file system
    const tempDir = path.join(process.cwd(), 'tmp');
    const sessionFilePath = path.join(tempDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      // If session file not found, return an error
      return NextResponse.json(
        { error: 'Session not found. Please upload a file first.' },
        { status: 404 }
      );
    }
    
    // Read and parse the session data from the file
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // Fetch master data for validation
    const masterData = await fetchMasterData();
    
    // Return the session data, records, and master data
    return NextResponse.json({
      sessionData: {
        id: sessionId,
        fileName: sessionData.fileName,
        uploadDate: sessionData.createdAt,
        recordCount: sessionData.recordCount,
        status: sessionData.status,
        fileSize: sessionData.fileSize
      },
      records: sessionData.data.records,
      masterData,
    });
    
  } catch (error) {
    console.error('Error retrieving session data:', error);
    // Add more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to retrieve session data: ${errorMessage}` },
      { status: 500 }
    );
  }
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to fetch master data for validation from the database
async function fetchMasterData() {
  try {
    console.log('Fetching master data from database...');
    
    // Fetch subregions
    const subRegions = await prisma.subRegion.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Fetch countries with their subregions
    const countries = await prisma.mSCountry.findMany({
      select: {
        id: true,
        name: true,
        cluster: true,
        subRegion: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Fetch categories with their ranges through the join table
    const categories = await prisma.category.findMany({
      include: {
        ranges: {
          include: {
            range: true
          }
        }
      }
    });
    
    // Log categories and their ranges for debugging
    categories.forEach(category => {
      const rangeCount = category.ranges?.length || 0;
      const rangeNames = category.ranges?.map(relation => relation.range.name).join(', ') || '';
      console.log(`Category: ${category.name} has ${rangeCount} ranges: ${rangeNames}`);
    });
    
    // Fetch ranges with their categories through the join table
    const ranges = await prisma.range.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    // Fetch media types
    const mediaTypes = await prisma.mediaType.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Fetch media subtypes with their media types
    const mediaSubtypes = await prisma.mediaSubtype.findMany({
      select: {
        id: true,
        name: true,
        mediaType: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Fetch business units
    const businessUnits = await prisma.businessUnit.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`Fetched master data: ${subRegions.length} subregions, ${countries.length} countries, ${categories.length} categories, ${ranges.length} ranges`);
    
    // Create a map of category names to their ranges for easier validation
    const categoryRangesMap: Record<string, string[]> = {};
    
    // Populate the map from the many-to-many relationship
    categories.forEach(category => {
      const categoryName = category.name.toLowerCase().trim();
      categoryRangesMap[categoryName] = [];
    });
    
    // Process the join table data to build the category-ranges map
    ranges.forEach(range => {
      if (range.categories) {
        range.categories.forEach(relation => {
          if (relation.category) {
            const categoryName = relation.category.name.toLowerCase().trim();
            const rangeName = range.name.toLowerCase().trim();
            
            if (!categoryRangesMap[categoryName]) {
              categoryRangesMap[categoryName] = [];
            }
            
            if (!categoryRangesMap[categoryName].includes(rangeName)) {
              categoryRangesMap[categoryName].push(rangeName);
            }
          }
        });
      }
    });
    
    // Create a map of range names to their valid categories
    const rangeToCategoryMap: Record<string, string> = {};
    const rangeToValidCategoriesMap: Record<string, string[]> = {};
    
    ranges.forEach(range => {
      const normalizedRangeName = range.name.toLowerCase().trim();
      
      // Initialize the array for this range
      if (!rangeToValidCategoriesMap[normalizedRangeName]) {
        rangeToValidCategoriesMap[normalizedRangeName] = [];
      }
      
      // Process all categories for this range
      if (range.categories) {
        range.categories.forEach(relation => {
          if (relation.category) {
            const normalizedCategoryName = relation.category.name.toLowerCase().trim();
            
            // For backward compatibility, use the first category as the default
            if (!rangeToCategoryMap[normalizedRangeName]) {
              rangeToCategoryMap[normalizedRangeName] = normalizedCategoryName;
            }
            
            // Only add the category if it's not already in the array
            if (!rangeToValidCategoriesMap[normalizedRangeName].includes(normalizedCategoryName)) {
              rangeToValidCategoriesMap[normalizedRangeName].push(normalizedCategoryName);
            }
          }
        });
      }
    });
    
    // Log all ranges and their categories for debugging
    console.log('Range to Category mapping:');
    Object.entries(rangeToCategoryMap).slice(0, 10).forEach(([range, category]) => {
      console.log(`  Range "${range}" belongs to category "${category}"`);
    });
    
    // Specific debugging for problematic ranges
    const problematicRanges = ['deep', 'q10', 'luminous 630'];
    console.log('\nDEBUGGING PROBLEMATIC RANGES:');
    problematicRanges.forEach(rangeName => {
      if (rangeToCategoryMap[rangeName]) {
        console.log(`  Range "${rangeName}" is mapped to category "${rangeToCategoryMap[rangeName]}"`);
      } else {
        console.log(`  Range "${rangeName}" is NOT found in the rangeToCategoryMap`);
      }
      
      // Check if this range appears in multiple categories
      const categoriesWithThisRange: string[] = [];
      Object.entries(categoryRangesMap).forEach(([catName, ranges]) => {
        if (ranges.includes(rangeName)) {
          categoriesWithThisRange.push(catName);
        }
      });
      
      if (categoriesWithThisRange.length > 0) {
        console.log(`  Range "${rangeName}" appears in these categories: ${categoriesWithThisRange.join(', ')}`);
      } else {
        console.log(`  Range "${rangeName}" does not appear in any category's ranges list`);
      }
    });
    
    console.log('Category to Ranges map created for validation');
    
    return {
      subRegions,
      countries,
      categories,
      ranges,
      mediaTypes,
      mediaSubtypes,
      businessUnits,
      categoryRangesMap, // Add the map for easier validation
      rangeToCategoryMap, // Add the map of ranges to their single correct category (for backward compatibility)
      rangeToValidCategoriesMap // Add the map of ranges to all their valid categories
    };
  } catch (error) {
    console.error('Error fetching master data from database:', error);
    throw error;
  }
}
