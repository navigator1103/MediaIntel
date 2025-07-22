import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FIELD_MAPPING = {
  'TargetAudience': 'targetAudience',
  'Gender': 'gender',
  'MinAge': 'minAge',
  'MaxAge': 'maxAge',
  'SaturationPoint': 'saturationPoint',
  'Budget': 'budget',
  'Frequency': 'frequency',
  'Reach': 'reach'
};

export async function POST(request: NextRequest) {
  try {
    const { sessionId, uploadedBy = 'admin' } = await request.json();

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

    if (!sessionData.canImport) {
      return NextResponse.json({ error: 'Data has validation errors and cannot be imported' }, { status: 400 });
    }

    const { countryId, businessUnitId } = sessionData;

    // Clear existing data for this country/business unit combination
    await prisma.digitalDiminishingReturns.deleteMany({
      where: {
        countryId,
        businessUnitId
      }
    });

    // Prepare data for import
    const importData = sessionData.records.map((record: any) => {
      // Handle budget with commas
      const cleanBudget = typeof record.Budget === 'string' ? record.Budget.replace(/,/g, '') : record.Budget;
      
      return {
        countryId,
        businessUnitId,
        targetAudience: record.TargetAudience?.toString() || '',
        gender: record.Gender?.toString() || '',
        minAge: parseInt(record.MinAge) || 0,
        maxAge: parseInt(record.MaxAge) || 0,
        saturationPoint: parseFloat(record.SaturationPoint) || 0,
        budget: parseFloat(cleanBudget) || 0,
        frequency: parseFloat(record.Frequency) || 0,
        reach: parseFloat(record.Reach) || 0,
        uploadedBy,
        uploadSession: sessionId
      };
    });

    // Import data in batches
    const batchSize = 100;
    let importedCount = 0;

    for (let i = 0; i < importData.length; i += batchSize) {
      const batch = importData.slice(i, i + batchSize);
      await prisma.digitalDiminishingReturns.createMany({
        data: batch,
        skipDuplicates: true
      });
      importedCount += batch.length;
    }

    // Update session with import status
    sessionData.importedAt = new Date().toISOString();
    sessionData.importedBy = uploadedBy;
    sessionData.importedCount = importedCount;
    sessionData.status = 'imported';

    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} Digital Diminishing Returns records`,
      importedCount,
      sessionId
    });

  } catch (error: any) {
    console.error('Digital Diminishing Returns import error:', error);
    return NextResponse.json({
      error: 'Import failed',
      details: error.message
    }, { status: 500 });
  }
}