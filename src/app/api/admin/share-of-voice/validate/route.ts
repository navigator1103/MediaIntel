import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ShareOfVoiceValidator } from '@/lib/validation/shareOfVoiceValidator';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'sov-';

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/share-of-voice/validate');
  
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid SOV session ID' }, { status: 400 });
    }
    
    // Load session data
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    console.log('Session loaded:', sessionId, 'Records:', sessionData.totalRecords);
    
    // Get country and business unit info
    const country = await prisma.country.findUnique({
      where: { id: sessionData.countryId }
    });
    
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: sessionData.businessUnitId }
    });
    
    if (!country || !businessUnit) {
      return NextResponse.json({ 
        error: 'Invalid country or business unit reference' 
      }, { status: 400 });
    }
    
    console.log('Validating for:', country.name, businessUnit.name);
    
    // Load master data for validation
    const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
    let masterData = {};
    
    if (fs.existsSync(masterDataPath)) {
      masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
    }
    
    // Initialize validator
    const validator = new ShareOfVoiceValidator(masterData, businessUnit.name!, country.name);
    
    // Get all records for validation
    const allRecordsFile = path.join(SESSIONS_DIR, `${sessionId}-full-records.json`);
    let allRecords = sessionData.records;
    
    if (fs.existsSync(allRecordsFile)) {
      const fullData = JSON.parse(fs.readFileSync(allRecordsFile, 'utf8'));
      allRecords = fullData.records || sessionData.records;
    }
    
    console.log(`Validating ${allRecords.length} records...`);
    
    // Run validation
    const validationResult = await validator.validateBatch(allRecords);
    
    console.log('Validation completed:', validationResult.summary);
    
    // Update session with validation results
    const updatedSessionData = {
      ...sessionData,
      status: 'validated',
      validationSummary: validationResult.summary,
      validationIssues: validationResult.issues,
      canImport: validationResult.summary.critical === 0,
      validatedAt: new Date().toISOString(),
      country: country.name,
      businessUnit: businessUnit.name
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(updatedSessionData, null, 2));
    
    return NextResponse.json({
      success: true,
      sessionId,
      summary: validationResult.summary,
      canImport: validationResult.summary.critical === 0,
      validationDetails: {
        totalRecords: allRecords.length,
        issuesFound: validationResult.issues.length,
        country: country.name,
        businessUnit: businessUnit.name
      }
    });
    
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json({
      error: 'Failed to validate data',
      details: error.message
    }, { status: 500 });
  }
}