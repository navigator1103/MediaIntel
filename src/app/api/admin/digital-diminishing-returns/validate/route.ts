import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DigitalDiminishingReturnsValidator } from '@/lib/validation/digitalDiminishingReturnsValidator';

// Load master data
const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
const masterData = fs.existsSync(masterDataPath) ? JSON.parse(fs.readFileSync(masterDataPath, 'utf-8')) : {};

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Load session data
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));

    if (sessionData.type !== 'digital-diminishing-returns') {
      return NextResponse.json({ error: 'Invalid session type for Digital Diminishing Returns' }, { status: 400 });
    }

    // Get business unit and country info for validation context
    const businessUnitName = sessionData.businessUnitId === 1 ? 'Nivea' : 'Derma'; // Simplified mapping
    const countryName = 'Global'; // Simplified for now

    // Initialize validator
    const validator = new DigitalDiminishingReturnsValidator(masterData, businessUnitName, countryName);

    // Validate data
    const validationResult = validator.validate(sessionData.records);

    // Update session with validation results
    sessionData.validationIssues = validationResult.issues;
    sessionData.validationSummary = validationResult.summary;
    sessionData.validatedAt = new Date().toISOString();
    sessionData.canImport = validationResult.summary.critical === 0;

    // Save updated session
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

    return NextResponse.json({
      success: true,
      sessionId,
      summary: validationResult.summary,
      canImport: validationResult.summary.critical === 0,
      issues: validationResult.issues,
      validationDetails: {
        businessUnit: businessUnitName,
        country: countryName,
        totalRecords: sessionData.totalRecords
      }
    });

  } catch (error: any) {
    console.error('Digital Diminishing Returns validation error:', error);
    return NextResponse.json({
      error: 'Validation failed',
      details: error.message
    }, { status: 500 });
  }
}