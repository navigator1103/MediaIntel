import axios from 'axios';

async function testRangeFilter() {
  console.log('Testing Range Filter...\n');
  
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
    
    // Test ranges endpoint
    const rangesResponse = await axios.get(`${baseURL}/api/ranges`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n=== Ranges API Response ===');
    console.log('Total ranges:', rangesResponse.data.length);
    console.log('First 10 ranges:');
    rangesResponse.data.slice(0, 10).forEach((r: any) => {
      console.log(`  - ${r.name} (ID: ${r.id})`);
    });
    
    // Test dashboard with range filter
    console.log('\n=== Testing Dashboard with Range Filter ===');
    
    // First get all data
    const dashboardResponse = await axios.get(`${baseURL}/api/dashboard/media-sufficiency`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Dashboard loaded successfully');
    console.log('Total campaigns:', dashboardResponse.data.summary.campaignCount);
    
    // Check if ranges are available in game plans
    const gamePlansResponse = await axios.get(`${baseURL}/api/dashboard/game-plans`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\nGame Plans with ranges:');
    const plansWithRanges = gamePlansResponse.data.filter((plan: any) => plan.range?.name);
    console.log(`  ${plansWithRanges.length} out of ${gamePlansResponse.data.length} game plans have ranges`);
    
    if (plansWithRanges.length > 0) {
      const uniqueRanges = [...new Set(plansWithRanges.map((p: any) => p.range.name))];
      console.log('  Unique ranges in game plans:', uniqueRanges);
    }
    
  } catch (error: any) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
  }
}

testRangeFilter().catch(console.error);