const fs = require('fs');
const path = require('path');

// Test reading session file directly
const sessionPath = '/Users/naveedshah/Documents/Python/MIQ_Current/data/sessions/ms-1753734573199-bvm9uy4d.json';

console.log('🔍 Testing Session Access');
console.log('========================');

try {
  console.log('1. Testing file system access...');
  const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  console.log('✅ Session file read successfully');
  console.log(`- Session ID: ${sessionData.id}`);
  console.log(`- Business Unit: ${sessionData.businessUnit}`);
  console.log(`- Records: ${sessionData.data.records.length}`);
  
  console.log('\n2. Testing API call...');
  fetch('http://localhost:3002/api/admin/media-sufficiency/upload?sessionId=ms-1753734573199-bvm9uy4d&includeRecords=true')
    .then(response => {
      console.log(`API Response Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log('API Response Data:');
      console.log(`- Session ID: ${data.sessionId}`);
      console.log(`- Business Unit: ${data.businessUnit}`);
      console.log(`- Validation Issues: ${data.validationIssues?.length || 'null'}`);
      console.log(`- Validation Summary: ${JSON.stringify(data.validationSummary)}`);
    })
    .catch(error => {
      console.error('API Error:', error);
    });
    
} catch (error) {
  console.error('File system error:', error);
}