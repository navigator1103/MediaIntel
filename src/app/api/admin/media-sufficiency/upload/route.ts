import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// We'll use temporary file storage for upload sessions

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/media-sufficiency/upload');
  const startTime = Date.now();
  try {
    // Check if the request is multipart/form-data or JSON with direct file path
    const contentType = request.headers.get('content-type') || '';
    console.log('Request content type:', contentType);
    
    // Handle direct file path upload (alternative to file dialog)
    if (contentType.includes('application/json')) {
      console.log('Processing JSON request with direct file path');
      const jsonData = await request.json();
      
      // Validate required fields
      const { filePath, lastUpdateId, country } = jsonData;
      
      if (!filePath) {
        console.error('No file path provided in JSON request');
        return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
      }
      
      if (!lastUpdateId) {
        console.error('No lastUpdateId provided in JSON request');
        return NextResponse.json({ error: 'Last update ID is required' }, { status: 400 });
      }
      
      if (!country) {
        console.error('No country provided in JSON request');
        return NextResponse.json({ error: 'Country is required' }, { status: 400 });
      }
      
      console.log(`Attempting to read file from server path: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at path: ${filePath}`);
        return NextResponse.json({ error: `File not found at path: ${filePath}` }, { status: 404 });
      }
      
      // Read file content
      console.log('Reading file from disk...');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      console.log(`File read successfully, size: ${fileContent.length} bytes`);
      
      // Extract filename from path
      const fileName = filePath.split('/').pop() || 'upload.csv';
      
      // Parse CSV data
      console.log('Parsing CSV data...');
      let records;
      try {
        records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true
        });
        console.log(`Parsed ${records.length} records from CSV file`);
      } catch (parseError) {
        console.error('Error parsing CSV:', parseError);
        return NextResponse.json(
          { error: `Failed to parse CSV: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
      
      // Generate session ID
      console.log('Generating session ID...');
      const sessionId = generateSessionId();
      console.log(`Session ID generated: ${sessionId}`);
      
      // Extract master data
      const masterData = extractMasterData(records);
      
      // Create sessions directory if needed
      console.log('Checking sessions directory...');
      const dataDir = path.join(process.cwd(), 'data', 'sessions');
      if (!fs.existsSync(dataDir)) {
        console.log('Sessions directory does not exist, creating it...');
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Sessions directory created successfully');
      }
      
      // Create session data
      const sessionData = {
        id: sessionId,
        originalFilename: fileName,
        fileSize: fileContent.length,
        recordCount: records.length,
        lastUpdateId,
        country,
        createdAt: new Date().toISOString(),
        status: 'pending',
        data: {
          masterData,
          records
        }
      };
      
      // Write session data to file
      console.log(`Writing session file to: ${path.join(dataDir, `${sessionId}.json`)}`);
      console.log(`Session data size: approximately ${(JSON.stringify(sessionData).length / (1024 * 1024)).toFixed(2)} MB`);
      
      try {
        fs.writeFileSync(
          path.join(dataDir, `${sessionId}.json`),
          JSON.stringify(sessionData, null, 2),
          'utf8'
        );
        console.log('Session file written successfully');
      } catch (writeError) {
        console.error('Error writing session file:', writeError);
        throw writeError;
      }
      
      // Create marker file
      fs.writeFileSync(
        path.join(dataDir, `${sessionId}.marker`),
        JSON.stringify({
          id: sessionId,
          originalFilename: fileName,
          recordCount: records.length,
          lastUpdateId,
          country,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }),
        'utf8'
      );
      
      const endTime = Date.now();
      console.log(`Direct path upload completed successfully in ${(endTime - startTime) / 1000} seconds`);
      
      return NextResponse.json({
        success: true,
        sessionId,
        recordCount: records.length,
        message: 'File uploaded successfully from server path'
      });
    }
    
    // Standard multipart form handling
    console.log('Attempting to parse form data...');
    const formData = await request.formData();
    console.log('Form data parsed successfully');
    const file = formData.get('file') as File;
    const lastUpdateId = formData.get('lastUpdateId') as string;
    const country = formData.get('country') as string;
    
    if (!file) {
      console.error('No file found in form data');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!lastUpdateId) {
      return NextResponse.json(
        { error: 'Last Update selection is required' },
        { status: 400 }
      );
    }
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country selection is required' },
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
    
    // Get the CSV content as text
    console.log(`Reading file content: ${file.name}, size: ${file.size} bytes`);
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new TextDecoder().decode(fileBuffer);
    console.log(`File content read successfully, length: ${fileContent.length} characters`);
    
    // Parse CSV data using proper CSV parser to handle quotes and commas correctly
    // Parse the CSV content
    console.log('Starting CSV parsing...');
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
    console.log('Generating session ID...');
    const sessionId = generateSessionId();
    console.log(`Session ID generated: ${sessionId}`);
    
    // Extract master data for validation
    const masterData = extractMasterData(records);
    
    // Create a persistent data directory if it doesn't exist
    // Using a directory that persists across server restarts
    console.log('Checking sessions directory...');
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    if (!fs.existsSync(dataDir)) {
      console.log('Sessions directory does not exist, creating it...');
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Sessions directory created successfully');
    } else {
      console.log('Sessions directory already exists');
    }
    
    // Store the session data in a temporary file
    const sessionData = {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      recordCount: records.length,
      status: 'uploaded',
      lastUpdateId: parseInt(lastUpdateId, 10), // Store the selected lastUpdateId
      country: country, // Store the selected country
      data: {
        records,
        masterData
      },
      createdAt: new Date().toISOString()
    };
    
    // Write session data to file in the persistent directory
    console.log(`Writing session file to: ${path.join(dataDir, `${sessionId}.json`)}`);
    console.log(`Session data size: approximately ${(JSON.stringify(sessionData).length / (1024 * 1024)).toFixed(2)} MB`);
    try {
      fs.writeFileSync(
        path.join(dataDir, `${sessionId}.json`),
        JSON.stringify(sessionData, null, 2),
        'utf8'
      );
      console.log('Session file written successfully');
    } catch (writeError) {
      console.error('Error writing session file:', writeError);
      throw writeError;
    }
    
    // Also create a marker file to help with session lookup
    fs.writeFileSync(
      path.join(dataDir, `${sessionId}-marker`),
      sessionId,
      'utf8'
    );
    
    // Return the session ID to the client
    const endTime = Date.now();
    console.log(`Upload process completed successfully in ${(endTime - startTime) / 1000} seconds`);
    
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
  const startTime = Date.now();
  console.log('GET request received at /api/admin/media-sufficiency/upload');
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
    
    const endTime = Date.now();
    console.log(`GET request processed successfully in ${(endTime - startTime) / 1000} seconds`);
    
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
    const endTime = Date.now();
    console.error(`Error retrieving session data after ${(endTime - startTime) / 1000} seconds:`, error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve session data' },
      { status: 500 }
    );
  }
}
