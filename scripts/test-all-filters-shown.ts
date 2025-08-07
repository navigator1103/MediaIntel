import axios from 'axios';

async function testAllFiltersShown() {
  console.log('\n=== Testing All Filter Options Display ===\n');
  
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('✓ Authenticated successfully\n');
    
    // Test all filter endpoints
    console.log('Fetching all filter options from API:');
    console.log('=====================================\n');
    
    // 1. Countries
    const countriesResponse = await axios.get('http://localhost:3001/api/countries', config);
    const countries = countriesResponse.data.map((c: any) => c.name).sort();
    console.log(`✅ Countries API: ${countries.length} options`);
    console.log(`   First 5: ${countries.slice(0, 5).join(', ')}`);
    console.log(`   Last 5: ${countries.slice(-5).join(', ')}\n`);
    
    // 2. Media Types
    const mediaTypesResponse = await axios.get('http://localhost:3001/api/media-types', config);
    const mediaTypes = mediaTypesResponse.data.map((mt: any) => mt.name).sort();
    console.log(`✅ Media Types API: ${mediaTypes.length} options`);
    console.log(`   All: ${mediaTypes.join(', ')}\n`);
    
    // 3. Categories
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories', config);
    const categories = categoriesResponse.data.map((c: any) => c.name).sort();
    console.log(`✅ Categories API: ${categories.length} options`);
    console.log(`   First 5: ${categories.slice(0, 5).join(', ')}`);
    console.log(`   Last 5: ${categories.slice(-5).join(', ')}\n`);
    
    // 4. PM Types
    const pmTypesResponse = await axios.get('http://localhost:3001/api/pm-types', config);
    const pmTypes = pmTypesResponse.data.map((pm: any) => pm.name).sort();
    console.log(`✅ PM Types API: ${pmTypes.length} options`);
    console.log(`   All: ${pmTypes.join(', ')}\n`);
    
    // Compare with dashboard data
    console.log('\nComparing with Dashboard Data:');
    console.log('==============================\n');
    
    const dashboardResponse = await axios.get('http://localhost:3001/api/dashboard/media-sufficiency', config);
    const dashboardData = dashboardResponse.data;
    
    const usedCountries = Object.keys(dashboardData.budgetByCountry || {});
    const usedMediaTypes = Object.keys(dashboardData.budgetByMediaType || {});
    const usedCategories = Object.keys(dashboardData.budgetByCategory || {});
    
    console.log('Options with actual data:');
    console.log(`  Countries: ${usedCountries.length} of ${countries.length} (${usedCountries.join(', ')})`);
    console.log(`  Media Types: ${usedMediaTypes.length} of ${mediaTypes.length} (${usedMediaTypes.join(', ')})`);
    console.log(`  Categories: ${usedCategories.length} of ${categories.length}`);
    
    console.log('\n🎉 EXPECTED BEHAVIOR:');
    console.log('====================');
    console.log('The dashboard filters should now show:');
    console.log(`  ✅ ${countries.length} countries (not just ${usedCountries.length})`);
    console.log(`  ✅ ${mediaTypes.length} media types`);
    console.log(`  ✅ ${categories.length} categories (not just ${usedCategories.length})`);
    console.log(`  ✅ ${pmTypes.length} PM types`);
    console.log('\nUsers can now filter by ANY option, even if no data exists for it.\n');
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
    console.log('\nMake sure the development server is running on port 3001');
  }
}

testAllFiltersShown().catch(console.error);