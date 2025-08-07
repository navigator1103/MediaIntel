import axios from 'axios';

async function testDynamicAccess() {
  console.log('\n=== Testing Dynamic Country Access ===\n');
  
  const baseURL = 'http://localhost:3001';
  
  console.log('1. Login as user@example.com:');
  console.log('=============================');
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    console.log('✓ Login successful');
    console.log('  Token type:', loginResponse.data.token.startsWith('ey') ? 'JWT' : 'Demo token');
    console.log('  User role:', loginResponse.data.user.role);
    console.log('  Accessible countries from login:', loginResponse.data.user.accessibleCountries);
    
    const token = loginResponse.data.token;
    
    console.log('\n2. Fetching accessible countries:');
    console.log('=================================');
    const countriesResponse = await axios.get(`${baseURL}/api/countries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✓ User can see ${countriesResponse.data.length} country(ies):`);
    countriesResponse.data.forEach((c: any) => {
      console.log(`    - ${c.name} (ID: ${c.id})`);
    });
    
    console.log('\n3. Fetching dashboard data:');
    console.log('===========================');
    const dashboardResponse = await axios.get(`${baseURL}/api/dashboard/media-sufficiency`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const countriesInData = Object.keys(dashboardResponse.data.budgetByCountry || {});
    console.log(`✓ Dashboard shows data for ${countriesInData.length} country(ies):`);
    countriesInData.forEach(country => {
      console.log(`    - ${country}`);
    });
    
    if (dashboardResponse.data.accessibleCountries) {
      console.log('\n  Accessible countries from API:');
      dashboardResponse.data.accessibleCountries.forEach((c: string) => {
        console.log(`    - ${c}`);
      });
    }
    
  } catch (error: any) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
  }
  
  console.log('\n=== Summary ===');
  console.log('The user should now only see India in:');
  console.log('1. The countries filter dropdown');
  console.log('2. The dashboard data');
  console.log('3. Any game plans or reports\n');
}

testDynamicAccess().catch(console.error);