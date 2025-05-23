import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Function to log with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

async function simulateImport() {
  try {
    // 1. Create a session ID
    const sessionId = uuidv4();
    logWithTimestamp(`Created session ID: ${sessionId}`);
    
    // 2. Copy a sample CSV file to the session directory
    const sampleCsvPath = path.join(process.cwd(), 'media-sufficiency-sample.csv');
    const sessionDir = path.join(process.cwd(), 'data', 'sessions');
    
    // Create the sessions directory if it doesn't exist
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    const sessionCsvPath = path.join(sessionDir, `${sessionId}-media-sufficiency-template.csv`);
    fs.copyFileSync(sampleCsvPath, sessionCsvPath);
    logWithTimestamp(`Copied sample CSV to session directory: ${sessionCsvPath}`);
    
    // 3. Create a session file with validation data
    const sessionFilePath = path.join(sessionDir, `${sessionId}.json`);
    interface MappedFields {
      [key: string]: string;
    }
    
    interface SessionData {
      id: string;
      status: string;
      progress: number;
      validationErrors: any[];
      importErrors: any[];
      mappedFields: MappedFields;
      records: any[];
    }
    
    const sessionData: SessionData = {
      id: sessionId,
      status: 'validated',
      progress: 100,
      validationErrors: [],
      importErrors: [],
      mappedFields: {
        "Year": "year",
        "Sub Region": "subRegion",
        "Country": "country",
        "Category": "category",
        "Range": "range",
        "Campaign": "campaign",
        "Media": "media",
        "Media Subtype": "mediaSubtype",
        "Budget": "budget",
        "Target Reach": "targetReach",
        "Current Reach": "currentReach"
      },
      records: []
    };
    
    // Read the CSV file and parse it to create records
    const csvContent = fs.readFileSync(sessionCsvPath, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Create sample records (simplified for testing)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const record: any = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          const fieldName = sessionData.mappedFields[header] || header;
          record[fieldName] = values[index];
        }
      });
      
      sessionData.records.push(record);
    }
    
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
    logWithTimestamp(`Created session file with ${sessionData.records.length} records: ${sessionFilePath}`);
    
    // 4. Call the import API
    logWithTimestamp('Calling import API...');
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    });
    
    const responseData = await response.json();
    logWithTimestamp('Import API response:', responseData);
    
    // 5. Poll for progress
    logWithTimestamp('Polling for import progress...');
    let importComplete = false;
    let attempts = 0;
    
    while (!importComplete && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const progressResponse = await fetch(`http://localhost:3000/api/admin/media-sufficiency/import-progress?sessionId=${sessionId}`);
      const progressData = await progressResponse.json();
      
      logWithTimestamp(`Import progress (attempt ${attempts}):`, progressData);
      
      if (progressData.status === 'completed' || progressData.status === 'error') {
        importComplete = true;
        logWithTimestamp('Import process finished with status:', progressData.status);
        
        if (progressData.status === 'error') {
          logWithTimestamp('Import errors:', progressData.errors);
        }
      }
    }
    
    logWithTimestamp('Simulation complete!');
    
  } catch (error) {
    console.error('Error during import simulation:', error);
  }
}

// Run the simulation
simulateImport();
