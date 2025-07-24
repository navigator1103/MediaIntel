import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { validateSessionMiddleware } from '@/lib/utils/sessionManager';

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    
    // Validate session with expiration check
    const sessionValidation = await validateSessionMiddleware(sessionId);
    if (!sessionValidation.success) {
      return NextResponse.json(
        { error: sessionValidation.error },
        { status: sessionValidation.statusCode }
      );
    }
    
    const sessionData = sessionValidation.sessionData!;
    
    // If validation issues aren't in the session data, generate them
    if (!sessionData.validationIssues && sessionData.data?.records && sessionData.data?.masterData) {
      const { AutoCreateValidator } = require('@/lib/validation/autoCreateValidator');
      const validator = new AutoCreateValidator(sessionData.data.masterData);
      
      // Validate the data
      try {
        // For large datasets, limit the validation to prevent timeouts
        const isLargeDataset = sessionData.records.length > 5000;
        let validationIssues;
        
        if (isLargeDataset) {
          // For large datasets, only validate the first 1000 records initially
          // The client will request batch validation for the rest
          validationIssues = await validator.validateAll(sessionData.data.records.slice(0, 1000), 0);
          sessionData.isLargeDataset = true;
          sessionData.totalIssueCount = validationIssues.length;
        } else {
          // For smaller datasets, validate all records
          validationIssues = await validator.validateAll(sessionData.data.records, 0);
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
