import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Function to log with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] PROGRESS: ${message}`, data);
  } else {
    console.log(`[${timestamp}] PROGRESS: ${message}`);
  }
}

// Function to log errors with timestamp
function logErrorWithTimestamp(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] PROGRESS ERROR: ${message}`, error);
  } else {
    console.error(`[${timestamp}] PROGRESS ERROR: ${message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const timestamp = searchParams.get('_t'); // For cache busting
    
    // Log request for debugging
    logWithTimestamp(`Import progress check for session ID: ${sessionId}, timestamp: ${timestamp}`);
    
    if (!sessionId) {
      logErrorWithTimestamp('Missing session ID in progress check request');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Get the session data from the persistent directory
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    logWithTimestamp(`Checking for session file: ${sessionFilePath}`);
    if (!fs.existsSync(sessionFilePath)) {
      logErrorWithTimestamp(`Session file not found: ${sessionFilePath}`);
      return NextResponse.json(
        { error: 'Session not found. Please upload and validate a file first.' },
        { status: 404 }
      );
    }
    
    // Read and parse the session data from the file
    logWithTimestamp(`Reading session file: ${sessionFilePath}`);
    let sessionDataRaw: string;
    try {
      sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
      logWithTimestamp(`Session file size: ${sessionDataRaw.length} bytes`);
    } catch (readError: any) {
      logErrorWithTimestamp('Error reading session file', readError);
      return NextResponse.json(
        { error: `Failed to read session file: ${readError.message}` },
        { status: 500 }
      );
    }
    
    let sessionData: any;
    try {
      sessionData = JSON.parse(sessionDataRaw);
      logWithTimestamp('Session data parsed successfully');
    } catch (parseError: any) {
      logErrorWithTimestamp('Error parsing session data JSON', parseError);
      return NextResponse.json(
        { error: `Failed to parse session data: ${parseError.message}` },
        { status: 500 }
      );
    }
    
    // Log the entire session data structure for debugging
    logWithTimestamp('Session data structure:', {
      status: sessionData.status,
      importProgress: sessionData.importProgress,
      hasNestedSessionData: !!sessionData.sessionData,
      keys: Object.keys(sessionData)
    });
    
    // Handle both direct and nested session data structures
    const status = sessionData.status || (sessionData.sessionData && sessionData.sessionData.status) || 'unknown';
    const importProgress = sessionData.importProgress || (sessionData.sessionData && sessionData.sessionData.importProgress);
    const importErrors = sessionData.importErrors || (sessionData.sessionData && sessionData.sessionData.importErrors) || [];
    
    // Log progress for debugging
    logWithTimestamp(`Progress for session ${sessionId}: ${status}, ${importProgress?.percentage || 0}%`, importProgress);
    
    // Set cache control headers to prevent caching
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Prepare response data
    const responseData = {
      status: status,
      progress: importProgress || {
        current: 0,
        total: 0,
        percentage: 0,
        stage: 'Not started'
      },
      errors: importErrors
    };
    
    // Log the response we're sending back
    logWithTimestamp(`Sending progress response for ${sessionId}:`, responseData);
    
    // Return the import progress information
    return NextResponse.json(responseData, { headers });
    
  } catch (error: any) {
    logErrorWithTimestamp('Unexpected error checking import progress', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to check import progress';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    // Set cache control headers to prevent caching
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(
      { 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500, headers }
    );
  }
}
