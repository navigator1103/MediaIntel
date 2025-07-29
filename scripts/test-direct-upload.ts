import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDirectUpload() {
  console.log('🧪 Testing Direct Upload API');
  console.log('=============================');
  
  try {
    // Get business units to find Nivea
    const businessUnits = await prisma.businessUnit.findMany();
    console.log('Available business units:', businessUnits.map(bu => ({ id: bu.id, name: bu.name })));
    
    const niveaBusinessUnit = businessUnits.find(bu => bu.name?.toLowerCase().includes('nivea'));
    if (!niveaBusinessUnit) {
      console.log('❌ Could not find Nivea business unit');
      return;
    }
    
    // Get a sample last update
    const lastUpdate = await prisma.lastUpdate.findFirst();
    if (!lastUpdate) {
      console.log('❌ Could not find last update');
      return;
    }
    
    console.log(`\n🎯 Testing with:`);
    console.log(`- Business Unit: ${niveaBusinessUnit.name} (ID: ${niveaBusinessUnit.id})`);
    console.log(`- Last Update: ${lastUpdate.name} (ID: ${lastUpdate.id})`);
    console.log(`- CSV File: /Users/naveedshah/Downloads/Bla bLa.csv`);
    
    // Call the upload API directly
    const uploadData = {
      filePath: '/Users/naveedshah/Downloads/Bla bLa.csv',
      lastUpdateId: lastUpdate.id.toString(),
      country: 'Germany',
      businessUnit: niveaBusinessUnit.id.toString()
    };
    
    console.log('\n📤 Calling upload API...');
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Upload failed:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    // Now get the validation data
    const sessionId = result.sessionId;
    console.log(`\n🔍 Getting validation data for session: ${sessionId}`);
    
    const validationResponse = await fetch(`http://localhost:3000/api/admin/media-sufficiency/upload?sessionId=${sessionId}&includeRecords=true`);
    
    if (!validationResponse.ok) {
      const errorText = await validationResponse.text();
      console.log('❌ Validation fetch failed:', validationResponse.status, errorText);
      return;
    }
    
    const validationData = await validationResponse.json();
    console.log('\n📊 Validation Summary:');
    console.log(`- Total Records: ${validationData.totalRecords}`);
    console.log(`- Total Issues: ${validationData.validationSummary?.total || 0}`);
    console.log(`- Critical Issues: ${validationData.validationSummary?.critical || 0}`);
    console.log(`- Warning Issues: ${validationData.validationSummary?.warning || 0}`);
    console.log(`- Suggestion Issues: ${validationData.validationSummary?.suggestion || 0}`);
    
    // Filter for business unit issues
    const businessUnitIssues = validationData.validationIssues?.filter((issue: any) => 
      issue.message.includes('Business unit mismatch') || 
      issue.message.includes('business unit')
    ) || [];
    
    console.log(`\n🏢 Business Unit Issues: ${businessUnitIssues.length}`);
    
    if (businessUnitIssues.length > 0) {
      console.log('\n❌ Business Unit Issues Found:');
      businessUnitIssues.forEach((issue: any, index: number) => {
        console.log(`${index + 1}. Row ${issue.rowIndex + 1}, Column: ${issue.columnName}`);
        console.log(`   Severity: ${issue.severity.toUpperCase()}`);
        console.log(`   Message: ${issue.message}`);
        console.log(`   Current Value: ${issue.currentValue || 'N/A'}`);
        console.log();
      });
      
      // Check if any critical issues for Aquaphor (should be row 4, index 3)
      const aquaphorIssues = businessUnitIssues.filter((issue: any) => issue.rowIndex === 3);
      if (aquaphorIssues.length > 0) {
        console.log('✅ PASS: Aquaphor (row 4) correctly flagged with business unit mismatch');
      } else {
        console.log('❌ FAIL: Aquaphor (row 4) should have business unit mismatch error');
      }
    } else {
      console.log('❌ FAIL: No business unit issues found - Aquaphor should have been flagged');
    }
    
    console.log('\n🎯 Expected Result:');
    console.log('- Aquaphor (Derma) in row 4 should have CRITICAL business unit mismatch error');
    console.log('- Other rows (Nivea categories) should pass business unit validation');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDirectUpload().catch(console.error);