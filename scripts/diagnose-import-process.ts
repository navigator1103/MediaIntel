import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

// Create a Prisma client
const prisma = new PrismaClient();

// Main diagnostic function
async function diagnoseImportProcess() {
  console.log('=== IMPORT PROCESS DIAGNOSTICS ===');
  console.log('Current working directory:', process.cwd());
  
  try {
    // Step 1: Check environment variables
    console.log('\n=== CHECKING ENVIRONMENT VARIABLES ===');
    checkEnvironmentVariables();
    
    // Step 2: Check file system permissions and structure
    console.log('\n=== CHECKING FILE SYSTEM ===');
    await checkFileSystem();
    
    // Step 3: Check database connections
    console.log('\n=== CHECKING DATABASE CONNECTIONS ===');
    await checkDatabaseConnections();
    
    // Step 4: Check API endpoints
    console.log('\n=== CHECKING API ENDPOINTS ===');
    await checkApiEndpoints();
    
    // Step 5: Run a test import
    console.log('\n=== RUNNING TEST IMPORT ===');
    await runTestImport();
    
    console.log('\n=== DIAGNOSTICS COMPLETED ===');
    
  } catch (error) {
    console.error('Error in diagnostics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to check environment variables
function checkEnvironmentVariables() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Not set');
  console.log('POSTGRES_URL:', process.env.POSTGRES_URL || 'Not set');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('.env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for required variables
    const hasDbUrl = envContent.includes('DATABASE_URL=');
    const hasPgUrl = envContent.includes('POSTGRES_URL=');
    
    console.log('DATABASE_URL in .env:', hasDbUrl ? 'Yes' : 'No');
    console.log('POSTGRES_URL in .env:', hasPgUrl ? 'Yes' : 'No');
    
    if (!hasDbUrl || !hasPgUrl) {
      console.warn('WARNING: Missing required environment variables in .env file');
    }
  } else {
    console.warn('WARNING: .env file does not exist');
  }
  
  // Check for PostgreSQL URL file
  const pgUrlPath = path.join(process.cwd(), '.postgres-url');
  if (fs.existsSync(pgUrlPath)) {
    console.log('.postgres-url file exists');
    const pgUrl = fs.readFileSync(pgUrlPath, 'utf8').trim();
    console.log('PostgreSQL URL from file:', pgUrl);
  } else {
    console.warn('WARNING: .postgres-url file does not exist');
  }
}

// Function to check file system permissions and structure
async function checkFileSystem() {
  // Check data directory
  const dataDir = path.join(process.cwd(), 'data');
  checkDirectory(dataDir, 'Data directory');
  
  // Check sessions directory
  const sessionsDir = path.join(dataDir, 'sessions');
  checkDirectory(sessionsDir, 'Sessions directory');
  
  // Check for recent session files
  const sessionFiles = fs.readdirSync(sessionsDir).filter(file => file.endsWith('.json'));
  console.log(`Found ${sessionFiles.length} session files`);
  
  if (sessionFiles.length > 0) {
    // Get the most recent session file
    const mostRecentFile = sessionFiles
      .map(file => ({ file, mtime: fs.statSync(path.join(sessionsDir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];
    
    console.log(`Most recent session file: ${mostRecentFile.file} (${mostRecentFile.mtime.toISOString()})`);
    
    // Check the content of the most recent session file
    const sessionFilePath = path.join(sessionsDir, mostRecentFile.file);
    try {
      const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
      console.log('Session status:', sessionData.status);
      console.log('Import progress:', sessionData.importProgress);
      
      if (sessionData.importErrors && sessionData.importErrors.length > 0) {
        console.log('Import errors:', sessionData.importErrors);
      }
    } catch (error) {
      console.error(`Error reading session file ${mostRecentFile.file}:`, error);
    }
  }
}

// Helper function to check directory existence and permissions
function checkDirectory(dirPath: string, label: string) {
  if (fs.existsSync(dirPath)) {
    console.log(`${label} exists: ${dirPath}`);
    
    // Check if directory is writable
    try {
      const testFile = path.join(dirPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`${label} is writable`);
    } catch (error) {
      console.error(`${label} is not writable:`, error);
    }
  } else {
    console.warn(`WARNING: ${label} does not exist: ${dirPath}`);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created ${label}: ${dirPath}`);
    } catch (error) {
      console.error(`Error creating ${label}:`, error);
    }
  }
}

// Function to check database connections
async function checkDatabaseConnections() {
  // Check SQLite connection
  console.log('Checking SQLite connection...');
  try {
    const sqliteResult = await prisma.$queryRaw`SELECT 'connected' as status`;
    console.log('SQLite connection:', sqliteResult);
  } catch (error) {
    console.error('Error connecting to SQLite:', error);
  }
  
  // Check PostgreSQL connection
  console.log('\nChecking PostgreSQL connection...');
  try {
    // Get PostgreSQL URL
    const pgUrl = getPostgresUrl();
    console.log('PostgreSQL URL:', pgUrl);
    
    // Create a new PrismaClient with PostgreSQL URL
    const pgPrisma = new PrismaClient({
      datasources: {
        db: {
          url: pgUrl
        }
      }
    });
    
    try {
      const pgResult = await pgPrisma.$queryRaw`SELECT current_database() as database`;
      console.log('PostgreSQL connection:', pgResult);
      
      // Check for required tables
      const tables = await pgPrisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('PostgreSQL tables:', tables);
      
    } catch (error) {
      console.error('Error querying PostgreSQL:', error);
    } finally {
      await pgPrisma.$disconnect();
    }
  } catch (error) {
    console.error('Error setting up PostgreSQL connection:', error);
  }
}

// Function to check API endpoints
async function checkApiEndpoints() {
  // Start the development server if not already running
  try {
    const isServerRunning = checkIfServerRunning();
    if (!isServerRunning) {
      console.log('Starting development server...');
      startDevServer();
    } else {
      console.log('Development server is already running');
    }
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check import API endpoint
    console.log('\nChecking import API endpoint...');
    try {
      const response = await fetch('http://localhost:3003/api/admin/media-sufficiency/import', {
        method: 'OPTIONS'
      });
      
      console.log('Import API status:', response.status);
      console.log('Import API headers:', response.headers);
    } catch (error) {
      console.error('Error checking import API:', error);
    }
    
    // Check import-progress API endpoint
    console.log('\nChecking import-progress API endpoint...');
    try {
      const response = await fetch('http://localhost:3003/api/admin/media-sufficiency/import-progress?sessionId=test', {
        method: 'GET'
      });
      
      console.log('Import-progress API status:', response.status);
      const data = await response.json();
      console.log('Import-progress API response:', data);
    } catch (error) {
      console.error('Error checking import-progress API:', error);
    }
    
  } catch (error) {
    console.error('Error checking API endpoints:', error);
  }
}

// Function to run a test import
async function runTestImport() {
  try {
    // Create a test session
    const sessionId = `diagnostic-${Date.now()}`;
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    // Create sample data for testing
    const sampleData = {
      sessionId,
      sessionData: {
        fileName: 'diagnostic-import.csv',
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
          subRegion: 'Diagnostic Region',
          country: 'Diagnostic Country',
          category: 'Diagnostic Category',
          range: 'Diagnostic Range',
          campaign: 'Diagnostic Campaign',
          media: 'Diagnostic Media',
          mediaSubtype: 'Diagnostic Subtype',
          pmType: 'Diagnostic PM Type',
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
          businessUnit: 'Diagnostic Business Unit'
        }
      ]
    };
    
    // Write the sample data to the session file
    fs.writeFileSync(sessionFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    console.log(`Created diagnostic session file: ${sessionFilePath}`);
    
    // Call the import API
    console.log('\nCalling import API...');
    try {
      const response = await fetch('http://localhost:3003/api/admin/media-sufficiency/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });
      
      console.log('Import API status:', response.status);
      const data = await response.json();
      console.log('Import API response:', data);
      
      // Poll import-progress API
      if (response.ok) {
        console.log('\nPolling import-progress API...');
        let completed = false;
        let attempts = 0;
        
        while (!completed && attempts < 30) {
          attempts++;
          
          try {
            const progressResponse = await fetch(`http://localhost:3003/api/admin/media-sufficiency/import-progress?sessionId=${sessionId}`, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log(`Poll ${attempts}: Status=${progressData.status}, Progress=${progressData.progress?.percentage || 0}%`);
              
              if (progressData.status === 'completed' || progressData.status === 'error') {
                completed = true;
                console.log('Final import status:', progressData);
                
                // Check session file for final results
                const finalSessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
                console.log('Final session data status:', finalSessionData.status);
                console.log('Import results:', finalSessionData.importResults);
                
                if (finalSessionData.importErrors && finalSessionData.importErrors.length > 0) {
                  console.log('Import errors:', finalSessionData.importErrors);
                }
              }
            } else {
              console.error(`Poll ${attempts} failed:`, await progressResponse.text());
            }
          } catch (error) {
            console.error(`Error in poll ${attempts}:`, error);
          }
          
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!completed) {
          console.warn('WARNING: Import did not complete within the expected time');
        }
      }
      
    } catch (error) {
      console.error('Error calling import API:', error);
    }
    
  } catch (error) {
    console.error('Error running test import:', error);
  }
}

// Helper function to get PostgreSQL URL
function getPostgresUrl() {
  try {
    // Try to read from .postgres-url file if it exists
    const pgUrlPath = path.join(process.cwd(), '.postgres-url');
    if (fs.existsSync(pgUrlPath)) {
      return fs.readFileSync(pgUrlPath, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error reading PostgreSQL URL from file:', error);
  }
  
  // Fall back to environment variable or default
  return process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/golden_rules';
}

// Helper function to check if server is running
function checkIfServerRunning() {
  try {
    const result = execSync('lsof -i:3003 -t', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Helper function to start development server
function startDevServer() {
  try {
    execSync('npm run dev -- --turbo &', { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    console.log('Development server started');
  } catch (error) {
    console.error('Error starting development server:', error);
  }
}

// Run the diagnostics
diagnoseImportProcess().catch(error => {
  console.error('Error in diagnostics script:', error);
  process.exit(1);
});
