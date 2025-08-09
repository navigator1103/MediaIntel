import axios from 'axios';

async function testSufficiencyAPI() {
  console.log('Testing Media Sufficiency Reach API...');
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Login as user
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Logged in successfully');
    
    // Test media sufficiency reach endpoint
    const reachResponse = await axios.get(`${baseURL}/api/dashboard/media-sufficiency-reach`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n=== API Response Structure ===');
    console.log('Summary:', {
      totalRecords: reachResponse.data.summary.totalRecords,
      countries: reachResponse.data.summary.countries,
      campaigns: reachResponse.data.summary.campaigns,
      totalWoa: reachResponse.data.summary.totalWoa,
      totalWoff: reachResponse.data.summary.totalWoff,
      totalWeeks: reachResponse.data.summary.totalWeeks
    });
    
    console.log('\nTV Reach Data count:', reachResponse.data.tvReachData.length);
    if (reachResponse.data.tvReachData.length > 0) {
      console.log('Sample TV data:', reachResponse.data.tvReachData[0]);
    }
    
    console.log('\nDigital Reach Data count:', reachResponse.data.digitalReachData.length);
    if (reachResponse.data.digitalReachData.length > 0) {
      console.log('Sample Digital data:', reachResponse.data.digitalReachData[0]);
    }
    
    console.log('\nCombined Reach Data count:', reachResponse.data.combinedReachData.length);
    if (reachResponse.data.combinedReachData.length > 0) {
      console.log('Sample Combined data:', reachResponse.data.combinedReachData[0]);
    }
    
  } catch (error: any) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSufficiencyAPI().catch(console.error);