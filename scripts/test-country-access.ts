import axios from 'axios';

async function testCountryAccess() {
  console.log('\n=== Testing Country-Based Access Control ===\n');
  
  const baseURL = 'http://localhost:3000';
  
  // Test 1: Admin user (full access)
  console.log('1. Testing Admin User (Full Access):');
  console.log('====================================');
  try {
    const adminLogin = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✓ Admin logged in successfully');
    
    // Get countries for admin
    const adminCountries = await axios.get(`${baseURL}/api/countries`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✓ Admin can see ${adminCountries.data.length} countries`);
    console.log(`  First 5: ${adminCountries.data.slice(0, 5).map((c: any) => c.name).join(', ')}`);
    
    // Get dashboard data for admin
    const adminDashboard = await axios.get(`${baseURL}/api/dashboard/media-sufficiency`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const adminCountriesInData = Object.keys(adminDashboard.data.budgetByCountry || {});
    console.log(`✓ Admin dashboard shows data for ${adminCountriesInData.length} countries`);
    console.log(`  Countries: ${adminCountriesInData.join(', ')}`);
    
  } catch (error: any) {
    console.error('✗ Admin test failed:', error.message);
  }
  
  console.log('\n2. Testing Regular User (Restricted Access):');
  console.log('============================================');
  try {
    const userLogin = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user'
    });
    
    const userToken = userLogin.data.token;
    const userAccess = userLogin.data.user;
    console.log('✓ User logged in successfully');
    console.log(`  User has accessibleCountries: ${userAccess.accessibleCountries}`);
    
    // Get countries for user
    const userCountries = await axios.get(`${baseURL}/api/countries`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log(`✓ User can see ${userCountries.data.length} countries`);
    console.log(`  Countries: ${userCountries.data.map((c: any) => c.name).join(', ')}`);
    
    // Get dashboard data for user
    const userDashboard = await axios.get(`${baseURL}/api/dashboard/media-sufficiency`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const userCountriesInData = Object.keys(userDashboard.data.budgetByCountry || {});
    console.log(`✓ User dashboard shows data for ${userCountriesInData.length} countries`);
    console.log(`  Countries: ${userCountriesInData.join(', ')}`);
    console.log(`  Accessible countries from API: ${userDashboard.data.accessibleCountries?.join(', ') || 'All'}`);
    
    // Verify game plans are filtered
    const userGamePlans = await axios.get(`${baseURL}/api/admin/media-sufficiency/game-plans`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const gamePlansData = userGamePlans.data.gamePlans || userGamePlans.data || [];
    const uniqueCountriesInGamePlans = new Set(
      gamePlansData
        .filter((gp: any) => gp.country)
        .map((gp: any) => gp.country.name)
    );
    
    console.log(`✓ User game plans filtered to ${uniqueCountriesInGamePlans.size} countries`);
    console.log(`  Countries in game plans: ${Array.from(uniqueCountriesInGamePlans).join(', ')}`);
    
  } catch (error: any) {
    console.error('✗ User test failed:', error.message);
  }
  
  console.log('\n3. Testing Unauthenticated Access:');
  console.log('===================================');
  try {
    // Try to access without token
    const noAuthCountries = await axios.get(`${baseURL}/api/countries`);
    console.log(`⚠ Unauthenticated request returned ${noAuthCountries.data.length} countries`);
    console.log('  (This might be expected behavior if API allows public access)');
  } catch (error: any) {
    console.log('✓ Unauthenticated request properly rejected:', error.response?.status || error.message);
  }
  
  console.log('\n=== Summary ===');
  console.log('Country-based access control is working if:');
  console.log('1. Admin sees all countries');
  console.log('2. Regular user sees only their assigned countries');
  console.log('3. Dashboard data is filtered accordingly');
  console.log('4. Game plans are filtered by country access\n');
}

testCountryAccess().catch(console.error);