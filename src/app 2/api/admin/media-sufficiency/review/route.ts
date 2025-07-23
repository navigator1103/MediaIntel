import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// API endpoint to get session data for the review page
export async function GET(request: NextRequest) {
  try {
    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    // Get the session data from the file system
    const tempDir = path.join(process.cwd(), 'tmp');
    const sessionFilePath = path.join(tempDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      // If session file not found, return an error
      return NextResponse.json(
        { error: 'Session not found. Please upload a file first.' },
        { status: 404 }
      );
    }
    
    // Read and parse the session data from the file
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // Transform the records into the format expected by the review page
    const campaignData = sessionData.data.records.map((record, index) => {
      return {
        id: index + 1,
        campaign: record['Campaign'] || '',
        country: record['Country'] || '',
        category: record['Category'] || '',
        range: record['Range'] || '',
        media: record['Media'] || '',
        mediaSubtype: record['Media Subtype'] || '',
        startDate: record['Start Date'] || '',
        endDate: record['End Date'] || '',
        budget: record['Budget'] ? parseFloat(record['Budget']) : 0,
        pmType: record['PM Type'] || '',
        businessUnit: record['Business Unit'] || '',
        cluster: record['Cluster'] || '',
        hasIssue: false // We can set this based on validation if needed
      };
    });
    
    // Return the transformed data
    return NextResponse.json({
      sessionData: {
        id: sessionId,
        fileName: sessionData.fileName,
        uploadDate: sessionData.createdAt,
        recordCount: sessionData.recordCount
      },
      campaignData
    });
    
  } catch (error) {
    console.error('Error retrieving session data for review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to retrieve session data for review: ${errorMessage}` },
      { status: 500 }
    );
  }
}
