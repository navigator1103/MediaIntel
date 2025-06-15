import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// We'll use temporary file storage for upload sessions

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const lastUpdateId = formData.get('lastUpdateId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!lastUpdateId) {
      return NextResponse.json(
        { error: 'Last Update selection is required' },
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
    
    // Parse CSV data using proper CSV parser to handle quotes and commas correctly
    let records;
    try {
      records = parse(fileContent, {
        columns: true, // Use first row as column headers
        skip_empty_lines: true,
        trim: true,
        auto_parse: false, // Keep all values as strings initially
        relax_column_count: true, // Allow inconsistent column counts
        delimiter: ',',
        quote: '"',
        escape: '"'
      });
    } catch (parseError) {
      console.error('CSV parsing error:', parseError);
      return NextResponse.json(
        { error: `CSV parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid CSV format'}` },
        { status: 400 }
      );
    }
    
    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'CSV file appears to be empty or contains no valid data rows' },
        { status: 400 }
      );
    }
    
    // Log detailed information about the parsed records
    if (records.length > 0) {
      console.log('Sample record:', JSON.stringify(records[0], null, 2));
      console.log('Record keys:', Object.keys(records[0]));
      console.log('Record values:', Object.values(records[0]));
      
      // Check if the required fields exist in the records
      const requiredFields = ['Year', 'Country', 'Category', 'Range', 'Campaign', 'Media', 'Media Subtype', 'Start Date', 'End Date', 'Budget'];
      const missingFields = requiredFields.filter(field => !records[0][field]);
      
      if (missingFields.length > 0) {
        console.log('Missing required fields in the CSV:', missingFields);
      } else {
        console.log('All required fields are present in the CSV');
      }
    }
    
    console.log(`Parsed ${records.length} records from CSV file`);
    
    // Generate a session ID for this upload
    const sessionId = generateSessionId();
    
    // Extract master data for validation
    const masterData = extractMasterData(records);
    
    // Create a persistent data directory if it doesn't exist
    // Using a directory that persists across server restarts
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Store the session data in a temporary file
    const sessionData = {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      recordCount: records.length,
      status: 'uploaded',
      lastUpdateId: parseInt(lastUpdateId, 10), // Store the selected lastUpdateId
      data: {
        records,
        masterData
      },
      createdAt: new Date().toISOString()
    };
    
    // Write session data to file in the persistent directory
    fs.writeFileSync(
      path.join(dataDir, `${sessionId}.json`),
      JSON.stringify(sessionData, null, 2),
      'utf8'
    );
    
    // Also create a marker file to help with session lookup
    fs.writeFileSync(
      path.join(dataDir, `${sessionId}-marker`),
      sessionId,
      'utf8'
    );
    
    // Return the session ID to the client
    return NextResponse.json({
      success: true,
      sessionId,
      recordCount: records.length,
      masterData: summarizeMasterData(masterData),
    });
    
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    // Add more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to process file: ${errorMessage}` },
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
  // Use a more reliable ID format with a prefix
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `ms-${timestamp}-${randomStr}`;
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
  
  try {
    // Read session data from file
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Read and parse the session data
    const sessionDataStr = fs.readFileSync(sessionFilePath, 'utf8');
    const session = JSON.parse(sessionDataStr);
    
    // Return session metadata without the full records
    return NextResponse.json({
      sessionId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      recordCount: session.recordCount,
      createdAt: session.createdAt,
      status: session.status,
      masterData: summarizeMasterData(session.data.masterData)
    });
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session data' },
      { status: 500 }
    );
  }
}
