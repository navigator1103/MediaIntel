import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// Separate session management for reach planning imports
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Expected fields for MediaSufficiency table
const EXPECTED_FIELDS = [
  'Last Update',
  'Sub Region', 
  'Country',
  'BU',
  'Category',
  'Range',
  'Campaign',
  'Franchise NS (Actual or Projected)',
  'Campaign Socio-Demo Target',
  'Total Country Population On Target (Abs)',
  'TV Copy Length',
  'TV Target Size (Abs)',
  'WOA Open TV',
  'WOA Paid TV',
  'Total TRPs',
  'TV R1+ (Total)',
  'TV R3+ (Total)',
  'TV IDEAL Reach',
  'CPP 2024',
  'CPP 2025',
  'Digital Target',
  'Digital Target Size (Abs)',
  'WOA PM & FF',
  'WOA Influencers (Amplification)',
  'Digital R1+ (Total)',
  'Digital IDEAL Reach',
  'Planned Combined Reach',
  'Combined IDEAL Reach',
  'Digital Reach Level Check',
  'TV Reach Level Check',
  'Combined Reach Level Check'
];

function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${SESSION_PREFIX}${timestamp}-${random}`;
}

function ensureSessionsDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/reach-planning/upload');
  const startTime = Date.now();
  
  try {
    ensureSessionsDirectory();
    
    const contentType = request.headers.get('content-type') || '';
    console.log('Request content type:', contentType);
    
    let fileContent: string;
    let fileName: string;
    
    // Handle file upload
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing multipart form data upload');
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      
      fileName = file.name;
      console.log(`File uploaded: ${fileName}, size: ${file.size} bytes`);
      
      // Validate file type
      if (!fileName.toLowerCase().endsWith('.csv')) {
        return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 });
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
      }
      
      fileContent = await file.text();
    } else if (contentType.includes('application/json')) {
      // Handle direct file path (for server-side uploads)
      console.log('Processing JSON request with direct file path');
      const jsonData = await request.json();
      const { filePath } = jsonData;
      
      if (!filePath) {
        return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
      }
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `File not found at path: ${filePath}` }, { status: 404 });
      }
      
      fileName = path.basename(filePath);
      fileContent = fs.readFileSync(filePath, 'utf8');
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }
    
    console.log(`File content length: ${fileContent.length} characters`);
    
    // Parse CSV
    console.log('Parsing CSV content...');
    let records: any[];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError: any) {
      console.error('CSV parsing error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse CSV file', 
        details: parseError.message 
      }, { status: 400 });
    }
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no valid records' }, { status: 400 });
    }
    
    console.log(`Parsed ${records.length} records from CSV`);
    
    // Generate session ID and save data
    const sessionId = generateSessionId();
    console.log(`Generated session ID: ${sessionId}`);
    
    // Extract headers for field mapping
    const headers = Object.keys(records[0]);
    console.log('CSV headers:', headers);
    
    // Create session data
    const sessionData = {
      sessionId,
      fileName,
      uploadedAt: new Date().toISOString(),
      totalRecords: records.length,
      headers,
      expectedFields: EXPECTED_FIELDS,
      records: records.slice(0, 100), // Store first 100 records for preview
      status: 'uploaded',
      fileSize: fileContent.length
    };
    
    // Save session data
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    const markerFile = path.join(SESSIONS_DIR, `${sessionId}-marker`);
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    fs.writeFileSync(markerFile, sessionId);
    
    console.log(`Session saved: ${sessionFile}`);
    console.log(`Processing completed in ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      sessionId,
      totalRecords: records.length,
      headers,
      expectedFields: EXPECTED_FIELDS,
      previewRecords: records.slice(0, 5), // Return first 5 for immediate preview
      processingTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Failed to process upload',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Reach Planning Upload API - Use POST to upload files',
    expectedFields: EXPECTED_FIELDS 
  });
}