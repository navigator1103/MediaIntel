import fs from 'fs';
import path from 'path';

// Test Playbook ID import functionality
async function testPlaybookIdImport() {
  console.log('🧪 Testing Playbook ID import functionality...');
  
  try {
    // 1. Create a test CSV with Playbook ID
    const testData = [
      {
        'Year': '2024',
        'Country': 'Australia',
        'Category': 'Face Care',
        'Range': 'Cellular',
        'Campaign': 'Genes',
        'Media': 'Digital',
        'Media Subtype': 'Facebook',
        'Start Date': '2024-01-01',
        'End Date': '2024-12-31',
        'Budget': '100000',
        'Q1 Budget': '25000',
        'Q2 Budget': '25000', 
        'Q3 Budget': '25000',
        'Q4 Budget': '25000',
        'PM Type': 'Full Funnel Basic',
        'Playbook ID': 'PB-2024-001' // Test Playbook ID
      },
      {
        'Year': '2024',
        'Country': 'Brazil',
        'Category': 'Sun',
        'Range': 'Sun',
        'Campaign': 'Sun Range',
        'Media': 'Traditional',
        'Media Subtype': 'TV',
        'Start Date': '2024-01-01',
        'End Date': '2024-12-31',
        'Budget': '50000',
        'PlaybookID': 'PB-2024-002' // Different column name variant
      },
      {
        'Year': '2024',
        'Country': 'India',
        'Category': 'Deo',
        'Range': 'Dry Deo',
        'Campaign': 'Dry Deo',
        'Media': 'Digital',
        'Media Subtype': 'Google',
        'Start Date': '2024-01-01',
        'End Date': '2024-12-31',
        'Budget': '75000',
        'PLAYBOOKID': 'PB-2024-003' // Another column name variant
      }
    ];

    // 2. Convert to CSV format
    const headers = Object.keys(testData[0]);
    const csvContent = [
      headers.join(','),
      ...testData.map(row => 
        headers.map(header => {
          const value = (row as any)[header] || '';
          // Quote values that contain commas or spaces
          return value.includes(',') || value.includes(' ') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    console.log('\n📄 Test CSV content:');
    console.log(csvContent);

    // 3. Create a temporary session file
    const sessionId = `test-playbook-${Date.now()}`;
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    
    // Ensure sessions directory exists
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    const sessionData = {
      sessionId,
      status: 'validated',
      originalFileName: 'test-playbook-import.csv',
      uploadedAt: new Date().toISOString(),
      validatedAt: new Date().toISOString(),
      records: testData,
      validationResults: {
        totalRecords: testData.length,
        validRecords: testData.length,
        invalidRecords: 0,
        criticalErrors: 0,
        warnings: 0,
        suggestions: 0
      }
    };

    const sessionFilePath = path.join(sessionsDir, `${sessionId}.json`);
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
    console.log(`\n📁 Created test session: ${sessionId}`);

    // 4. Test the import API
    console.log('\n🚀 Testing import API...');
    
    const importResponse = await fetch('http://localhost:3000/api/admin/media-sufficiency/import-sqlite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionId,
        lastUpdateId: 1 // Use a default last update ID
      })
    });

    const importResult = await importResponse.json();
    console.log('Import API Response:', importResult);

    if (importResponse.ok) {
      console.log('✅ Import request submitted successfully');
      
      // 5. Wait a bit and check progress
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const progressResponse = await fetch(`http://localhost:3000/api/admin/media-sufficiency/import-progress?sessionId=${sessionId}`);
      const progressResult = await progressResponse.json();
      console.log('\n📊 Import Progress:', progressResult);
      
      // 6. Check if records were created in database
      console.log('\n🔍 Checking database for imported records...');
      
      const checkResponse = await fetch('http://localhost:3000/api/admin/media-sufficiency/check-playbook-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          playbookIds: ['PB-2024-001', 'PB-2024-002', 'PB-2024-003']
        })
      });

      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        console.log('Database check result:', checkResult);
      } else {
        console.log('⚠️  Could not check database (API endpoint may not exist)');
        console.log('But import appears to have been processed');
      }
      
    } else {
      console.log('❌ Import request failed:', importResult);
    }

    // 7. Clean up test session
    try {
      fs.unlinkSync(sessionFilePath);
      console.log('\n🧹 Cleaned up test session file');
    } catch (error) {
      console.log('⚠️  Could not clean up test session file');
    }

  } catch (error) {
    console.error('❌ Error testing Playbook ID import:', error);
  }
}

testPlaybookIdImport();