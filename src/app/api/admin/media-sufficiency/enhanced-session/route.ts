import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Construct path to session file in the persistent directory
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    try {
      // Check if session file exists
      await fs.access(sessionFilePath);
    } catch (error) {
      return NextResponse.json({ error: 'Session not found. Please upload a file first.' }, { status: 404 });
    }
    
    // Read session data from file
    const sessionDataRaw = await fs.readFile(sessionFilePath, 'utf-8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // If validation issues aren't in the session data, generate them
    if (!sessionData.validationIssues && sessionData.records && sessionData.sessionData?.masterData) {
      const MediaSufficiencyValidator = require('@/lib/validation/mediaSufficiencyValidator').default;
      const validator = new MediaSufficiencyValidator(sessionData.sessionData.masterData);
      
      // Validate the data
      try {
        // For large datasets, limit the validation to prevent timeouts
        const isLargeDataset = sessionData.records.length > 5000;
        let validationIssues;
        
        if (isLargeDataset) {
          // For large datasets, only validate the first 1000 records initially
          // The client will request batch validation for the rest
          validationIssues = await validator.validateAll(sessionData.records.slice(0, 1000), 0);
          sessionData.isLargeDataset = true;
          sessionData.totalIssueCount = validationIssues.length;
        } else {
          // For smaller datasets, validate all records
          validationIssues = await validator.validateAll(sessionData.records, 0);
        }
        
        sessionData.validationIssues = validationIssues;
        
        // Generate validation summary
        const validationSummary = validator.getValidationSummary(validationIssues);
        sessionData.validationSummary = validationSummary;
        
        // Save the updated session data with validation results
        await fs.writeFile(sessionFilePath, JSON.stringify(sessionData));
      } catch (error) {
        console.error('Error validating data:', error);
      }
    }
    
    return NextResponse.json(sessionData);
    
  } catch (error) {
    console.error('Error retrieving session data:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to retrieve session data' 
    }, { status: 500 });
  }
}
