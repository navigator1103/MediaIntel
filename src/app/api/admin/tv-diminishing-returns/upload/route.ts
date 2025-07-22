import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const EXPECTED_FIELDS = [
  'TargetAudience',
  'Gender', 
  'MinAge',
  'MaxAge',
  'SaturationPoint',
  'TRP',
  'Reach'
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const countryId = formData.get('countryId') as string;
    const businessUnitId = formData.get('businessUnitId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!countryId || !businessUnitId) {
      return NextResponse.json({ error: 'Country and Business Unit are required' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const csvData = buffer.toString('utf-8');

    // Parse CSV
    let records;
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError: any) {
      return NextResponse.json({
        error: 'Failed to parse CSV file',
        details: parseError.message
      }, { status: 400 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Validate required columns
    const actualFields = Object.keys(records[0]);
    const missingFields = EXPECTED_FIELDS.filter(field => !actualFields.includes(field));
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required columns',
        missingFields,
        expectedFields: EXPECTED_FIELDS,
        actualFields
      }, { status: 400 });
    }

    // Generate session ID
    const sessionId = `tvdr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save session data
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const sessionData = {
      sessionId,
      fileName: file.name,
      totalRecords: records.length,
      records,
      countryId: parseInt(countryId),
      businessUnitId: parseInt(businessUnitId),
      uploadedAt: new Date().toISOString(),
      type: 'tv-diminishing-returns'
    };

    fs.writeFileSync(
      path.join(sessionsDir, `${sessionId}.json`),
      JSON.stringify(sessionData, null, 2)
    );

    return NextResponse.json({
      success: true,
      sessionId,
      totalRecords: records.length,
      message: 'TV Diminishing Returns data uploaded successfully'
    });

  } catch (error: any) {
    console.error('TV Diminishing Returns upload error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error.message
    }, { status: 500 });
  }
}