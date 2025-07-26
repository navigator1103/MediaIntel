import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// Separate session management for reach planning imports
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Expected fields for MediaSufficiency table
const EXPECTED_FIELDS = [
  'Last Update', 'Sub Region', 'Country', 'BU', 'Category', 'Range', 'Campaign',
  'TV Demo Gender', 'TV Demo Min. Age', 'TV Demo Max. Age', 'TV SEL', 
  'Final TV Target (don\'t fill)', 'TV Target Size', 'TV Copy Length',
  'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Potential R1+',
  'CPP 2024', 'CPP 2025', 'CPP 2026', 'Reported Currency',
  'Is Digital target the same than TV?', 'Digital Demo Gender', 'Digital Demo Min. Age', 
  'Digital Demo Max. Age', 'Digital SEL', 'Final Digital Target (don\'t fill)',
  'Digital Target Size (Abs)', 'Total Digital Planned R1+', 'Total Digital Potential R1+',
  'Planned Combined Reach', 'Combined Potential Reach'
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
    
    let lastUpdateId: string | null = null;
    let countryId: string | null = null;
    
    // Handle file upload
    if (contentType.includes('multipart/form-data')) {
      console.log('Processing multipart form data upload');
      const formData = await request.formData();
      const file = formData.get('file') as File;
      lastUpdateId = formData.get('lastUpdateId') as string;
      countryId = formData.get('countryId') as string;
      
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      
      if (!lastUpdateId) {
        return NextResponse.json({ error: 'Financial cycle is required' }, { status: 400 });
      }
      
      if (!countryId) {
        return NextResponse.json({ error: 'Country is required' }, { status: 400 });
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
    
    // Parse CSV with enhanced error handling
    console.log('Parsing CSV content...');
    let records: any[];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relaxColumnCount: true, // Allow inconsistent column counts
        relaxQuotes: true,      // Handle malformed quotes gracefully
        skipRecordsWithError: false // Don't skip errors, report them
      });
    } catch (parseError: any) {
      console.error('CSV parsing error:', parseError);
      
      // Provide more helpful error messages
      let friendlyMessage = parseError.message;
      
      if (parseError.message.includes('Invalid Record Length')) {
        const match = parseError.message.match(/columns length is (\d+), got (\d+) on line (\d+)/);
        if (match) {
          const [, expected, actual, line] = match;
          friendlyMessage = `Row ${line} has ${actual} columns but expected ${expected} columns. Please check for missing commas or extra data in row ${line}.`;
        }
      } else if (parseError.message.includes('Invalid quoted field')) {
        friendlyMessage = 'Invalid quotes in CSV file. Please check for unmatched quotes (") in your data.';
      } else if (parseError.message.includes('Unterminated quoted field')) {
        friendlyMessage = 'Unterminated quoted field found. Please ensure all quoted fields are properly closed with matching quotes.';
      }
      
      return NextResponse.json({ 
        error: 'Failed to parse CSV file', 
        details: friendlyMessage,
        originalError: parseError.message
      }, { status: 400 });
    }
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no valid records' }, { status: 400 });
    }
    
    console.log(`Parsed ${records.length} records from CSV`);
    
    // Post-parsing validation for data consistency
    const expectedHeaders = Object.keys(records[0]);
    const issues: string[] = [];
    
    // Check for records with inconsistent column counts
    records.forEach((record, index) => {
      const recordKeys = Object.keys(record);
      if (recordKeys.length !== expectedHeaders.length) {
        issues.push(`Row ${index + 2} has ${recordKeys.length} columns but expected ${expectedHeaders.length} columns`);
      }
      
      // Check for undefined values which might indicate parsing issues
      const undefinedColumns = recordKeys.filter(key => record[key] === undefined);
      if (undefinedColumns.length > 0) {
        issues.push(`Row ${index + 2} has undefined values in columns: ${undefinedColumns.join(', ')}`);
      }
    });
    
    // If there are structural issues, report them but continue processing
    if (issues.length > 0) {
      console.warn('CSV structure issues detected:', issues);
      // We could either fail here or continue with a warning
      // For now, let's continue but log the issues
    }
    
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
      fileSize: fileContent.length,
      lastUpdateId: parseInt(lastUpdateId || '0'),
      countryId: parseInt(countryId || '0')
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