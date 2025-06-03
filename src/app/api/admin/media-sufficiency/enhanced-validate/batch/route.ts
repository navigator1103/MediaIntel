import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import MediaSufficiencyValidator from '@/lib/validation/mediaSufficiencyValidator';

// Handle batch validation for large datasets
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }
    
    // Get session data file path
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    // Check if session file exists
    try {
      await fs.access(sessionFilePath);
    } catch (error) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Read session data
    const sessionDataRaw = await fs.readFile(sessionFilePath, 'utf-8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // Get records and master data from session
    const { records, sessionData: { masterData } } = sessionData;
    
    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'No records found in session' }, { status: 400 });
    }
    
    console.log(`Processing ${records.length} records for batch validation...`);
    
    // Initialize validator with master data
    const validator = new MediaSufficiencyValidator(masterData);
    
    // Process records in chunks to prevent memory issues
    const CHUNK_SIZE = 1000; // Process 1000 records at a time
    let allIssues: any[] = [];
    
    // Process data in chunks for large datasets
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const batchEnd = Math.min(i + CHUNK_SIZE, records.length);
      const chunk = records.slice(i, i + CHUNK_SIZE);
      
      console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(records.length / CHUNK_SIZE)}`);
      
      // Validate the chunk
      const chunkIssues = await validator.validateAll(chunk, i);
      
      // Add issues to the collection
      allIssues.push(...chunkIssues);
      
      // Allow GC to reclaim memory between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Generate validation summary
    const validationSummary = validator.getValidationSummary(allIssues);
    
    // Update session data with validation results
    sessionData.validationIssues = allIssues;
    sessionData.validationSummary = validationSummary;
    sessionData.status = 'validated';
    
    // Save updated session data
    await fs.writeFile(sessionFilePath, JSON.stringify(sessionData));
    
    // For very large datasets, return a limited set of issues to improve client performance
    const isLargeDataset = records.length > 10000;
    
    return NextResponse.json({
      success: true,
      validationSummary,
      validationIssues: isLargeDataset ? allIssues.slice(0, 100) : allIssues,
      totalIssueCount: allIssues.length,
      isLargeDataset
    });
    
  } catch (error) {
    console.error('Error processing batch validation:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process batch validation' 
    }, { status: 500 });
  }
}
