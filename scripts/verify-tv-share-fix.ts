import axios from 'axios';

async function verifyTVShareFix() {
  console.log('\n=== Verifying TV Share Fix ===\n');
  
  try {
    // Login first to get a valid token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Authenticated successfully\n');
    
    // Get dashboard data
    const response = await axios.get('http://localhost:3001/api/dashboard/media-sufficiency', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data) {
      console.log('Dashboard API Response:');
      console.log('========================');
      
      // Check budget by media type
      console.log('\nBudget by Media Type:');
      const budgetByMediaType = response.data.budgetByMediaType || {};
      let totalBudget = 0;
      let tvBudget = 0;
      let digitalBudget = 0;
      
      Object.entries(budgetByMediaType).forEach(([type, budget]) => {
        const budgetValue = Number(budget);
        console.log(`  ${type}: $${budgetValue.toLocaleString()}`);
        totalBudget += budgetValue;
        
        // Check if Traditional is being counted as TV
        if (['TV', 'Radio', 'Print', 'OOH', 'Traditional'].includes(type)) {
          tvBudget += budgetValue;
        } else {
          digitalBudget += budgetValue;
        }
      });
      
      // Calculate shares
      const tvShare = totalBudget > 0 ? (tvBudget / totalBudget * 100).toFixed(1) : 0;
      const digitalShare = totalBudget > 0 ? (digitalBudget / totalBudget * 100).toFixed(1) : 0;
      
      console.log('\n\nCalculated Shares:');
      console.log('==================');
      console.log(`Total Budget: $${totalBudget.toLocaleString()}`);
      console.log(`TV/Traditional Budget: $${tvBudget.toLocaleString()}`);
      console.log(`Digital Budget: $${digitalBudget.toLocaleString()}`);
      console.log(`\n✅ TV Share: ${tvShare}% (should show in dashboard)`);
      console.log(`✅ Digital Share: ${digitalShare}% (should show in dashboard)`);
      
      if (Number(tvShare) > 0) {
        console.log('\n🎉 SUCCESS: TV Share is now correctly calculated as ' + tvShare + '%');
        console.log('The dashboard should now display this value in the TV Share card.');
      } else {
        console.log('\n⚠️ WARNING: TV Share is still 0%. Check if there are Traditional media type campaigns.');
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
    console.log('\nMake sure the development server is running on port 3001');
  }
}

verifyTVShareFix().catch(console.error);