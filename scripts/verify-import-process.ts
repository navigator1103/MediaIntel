import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

/**
 * This script verifies that the import process is working correctly by:
 * 1. Creating a test session with sample data
 * 2. Calling the import API endpoint
 * 3. Monitoring the import progress
 * 4. Verifying the final import results
 */
async function verifyImportProcess() {
  console.log('=== VERIFYING IMPORT PROCESS ===');
  console.log('Current working directory:', process.cwd());
  
  try {
    // Step 1: Create a test session
    console.log('\n=== CREATING TEST SESSION ===');
    const sessionId = await createTestSession();
    
    // Step 2: Call the import API
    console.log('\n=== CALLING IMPORT API ===');
    const importResult = await callImportApi(sessionId);
    
    if (!importResult.success) {
      console.error('Import API call failed:', importResult.error);
      return;
    }
    
    // Step 3: Monitor import progress
    console.log('\n=== MONITORING IMPORT PROGRESS ===');
    const importProgress = await monitorImportProgress(sessionId);
    
    // Step 4: Verify import results
    console.log('\n=== VERIFYING IMPORT RESULTS ===');
    await verifyImportResults(sessionId);
    
    console.log('\n=== VERIFICATION COMPLETED ===');
    
  } catch (error) {
    console.error('Error verifying import process:', error);
  }
}

// Function to create a test session
async function createTestSession() {
  try {
    // Create a unique session ID
    const sessionId = `verify-${Date.now()}`;
    console.log('Session ID:', sessionId);
    
    // Create the sessions directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    }
    
    // Create sample data for testing
    const sampleData = {
      sessionId,
      sessionData: {
        fileName: 'verify-import.csv',
        uploadedAt: new Date().toISOString(),
      },
      status: 'validated',
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      records: [
        {
          year: 2025,
          subRegion: 'Verification Region',
          country: 'Verification Country',
          category: 'Verification Category',
          range: 'Verification Range',
          campaign: 'Verification Campaign',
          media: 'Verification Media',
          mediaSubtype: 'Verification Subtype',
          pmType: 'Verification PM Type',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          totalBudget: 10000,
          targetReach: 1000,
          currentReach: 800,
          targetFrequency: 5,
          currentFrequency: 4,
          targetGrps: 5000,
          currentGrps: 4000,
          reach1Plus: 800,
          reach2Plus: 600,
          reach3Plus: 400,
          businessUnit: 'Verification Business Unit'
        }
      ]
    };
    
    // Write the sample data to the session file
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    fs.writeFileSync(sessionFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    console.log(`Created test session file: ${sessionFilePath}`);
    
    return sessionId;
  } catch (error) {
    console.error('Error creating test session:', error);
    throw error;
  }
}

// Function to call the import API
async function callImportApi(sessionId: string) {
  try {
    console.log('Calling import API with session ID:', sessionId);
    
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    });
    
    console.log('Import API status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Import API response:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error('Import API error:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('Error calling import API:', error);
    return { success: false, error };
  }
}

// Function to monitor import progress
async function monitorImportProgress(sessionId: string) {
  try {
    console.log('Monitoring import progress for session ID:', sessionId);
    
    let completed = false;
    let attempts = 0;
    let finalProgress = null;
    
    while (!completed && attempts < 30) {
      attempts++;
      
      try {
        const response = await fetch(`http://localhost:3000/api/admin/media-sufficiency/import-progress?sessionId=${sessionId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Poll ${attempts}: Status=${data.status}, Progress=${data.progress?.percentage || 0}%`);
          
          if (data.status === 'completed' || data.status === 'error') {
            completed = true;
            finalProgress = data;
            console.log('Final import status:', data);
          }
        } else {
          console.error(`Poll ${attempts} failed:`, await response.text());
        }
      } catch (error) {
        console.error(`Error in poll ${attempts}:`, error);
      }
      
      // Wait before next poll
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!completed) {
      console.warn('WARNING: Import did not complete within the expected time');
    }
    
    return finalProgress;
  } catch (error) {
    console.error('Error monitoring import progress:', error);
    throw error;
  }
}

// Function to verify import results
async function verifyImportResults(sessionId: string) {
  try {
    // Read the session file to check final results
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    if (fs.existsSync(sessionFilePath)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
      
      console.log('Final session status:', sessionData.status);
      console.log('Import progress:', sessionData.importProgress);
      
      if (sessionData.importResults) {
        console.log('Import results summary:');
        Object.keys(sessionData.importResults).forEach(key => {
          console.log(`- ${key}: ${sessionData.importResults[key].length} items`);
        });
      } else {
        console.warn('WARNING: No import results found in session data');
      }
      
      if (sessionData.importErrors && sessionData.importErrors.length > 0) {
        console.error('Import errors:', sessionData.importErrors);
      } else {
        console.log('No import errors found');
      }
      
      // Check if the import needs admin approval
      if (sessionData.needsAdminApproval) {
        console.log('Import needs admin approval before transferring to SQLite');
      }
      
      return sessionData;
    } else {
      console.error('Session file not found:', sessionFilePath);
      return null;
    }
  } catch (error) {
    console.error('Error verifying import results:', error);
    throw error;
  }
}

// Run the verification
verifyImportProcess().catch(error => {
  console.error('Error in verification script:', error);
  process.exit(1);
});
