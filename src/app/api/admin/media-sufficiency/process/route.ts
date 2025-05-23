import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a temporary storage for upload sessions
// In a production environment, this should be stored in a database or Redis
const uploadSessions = new Map();

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check if file is CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }
    
    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new TextDecoder().decode(fileBuffer);
    
    // Parse CSV data
    // First, split by lines and remove the first line (which is just a number)
    const lines = fileContent.split('\n');
    const csvDataWithoutFirstLine = lines.slice(1).join('\n');
    
    // Parse the CSV data
    const records = parse(csvDataWithoutFirstLine, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      from_line: 2 // Skip the header row
    });
    
    console.log(`Parsed ${records.length} records from CSV file`);
    
    // Generate a session ID for this upload
    const sessionId = generateSessionId();
    
    // Extract master data for validation
    const masterData = extractMasterData(records);
    
    // Store the parsed data and master data in the session
    uploadSessions.set(sessionId, {
      records,
      masterData,
      timestamp: new Date(),
      fileName: file.name,
      fileSize: file.size,
      status: 'uploaded',
    });
    
    // Return the session ID to the client
    return NextResponse.json({
      success: true,
      sessionId,
      recordCount: records.length,
      masterData: summarizeMasterData(masterData),
    });
    
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

// Extract master data from records for validation
function extractMasterData(records: any[]) {
  const subRegions = new Set();
  const countries = new Map(); // country name -> { subRegion, cluster }
  const categories = new Set();
  const ranges = new Map(); // range name -> category
  const mediaTypes = new Set();
  const mediaSubtypes = new Map(); // subtype name -> media type
  const businessUnits = new Set();
  
  // Process each record to extract unique values
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
    const businessUnit = record['BU'];
    
    if (subRegion) subRegions.add(subRegion);
    
    if (country && subRegion) {
      countries.set(country, {
        subRegion: subRegion,
        cluster: record['Cluster'] || null
      });
    }
    
    if (category) categories.add(category);
    
    if (range && category) {
      ranges.set(`${range}_${category}`, {
        name: range,
        category: category
      });
    }
    
    if (media) mediaTypes.add(media);
    
    if (mediaSubtype && media) {
      mediaSubtypes.set(`${mediaSubtype}_${media}`, {
        name: mediaSubtype,
        mediaType: media
      });
    }
    
    if (businessUnit) businessUnits.add(businessUnit);
  }
  
  return {
    subRegions: Array.from(subRegions),
    countries: Array.from(countries.entries()).map(([name, data]) => ({
      name,
      subRegion: data.subRegion,
      cluster: data.cluster
    })),
    categories: Array.from(categories),
    ranges: Array.from(ranges.entries()).map(([key, data]) => ({
      name: data.name,
      category: data.category
    })),
    mediaTypes: Array.from(mediaTypes),
    mediaSubtypes: Array.from(mediaSubtypes.entries()).map(([key, data]) => ({
      name: data.name,
      mediaType: data.mediaType
    })),
    businessUnits: Array.from(businessUnits)
  };
}

// Create a summary of master data for the response
function summarizeMasterData(masterData: any) {
  return {
    subRegionsCount: masterData.subRegions.length,
    countriesCount: masterData.countries.length,
    categoriesCount: masterData.categories.length,
    rangesCount: masterData.ranges.length,
    mediaTypesCount: masterData.mediaTypes.length,
    mediaSubtypesCount: masterData.mediaSubtypes.length,
    businessUnitsCount: masterData.businessUnits.length
  };
}

// Generate a unique session ID
function generateSessionId(): string {
  // Use a combination of timestamp and random numbers for uniqueness
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 1000000);
  const random2 = Math.floor(Math.random() * 1000000);
  
  // Combine them into a string
  return `session-${timestamp}-${random1}-${random2}`;
}

// GET endpoint to retrieve session data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }
  
  const session = uploadSessions.get(sessionId);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }
  
  // Return session metadata without the full records
  return NextResponse.json({
    sessionId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    recordCount: session.records.length,
    timestamp: session.timestamp,
    status: session.status,
    masterData: summarizeMasterData(session.masterData)
  });
}
