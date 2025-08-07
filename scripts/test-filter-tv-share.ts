import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFilterTVShare() {
  console.log('\n=== Testing Filter Impact on TV Share ===\n');
  
  try {
    // Get all game plans with media type info
    const gamePlans = await prisma.gamePlan.findMany({
      include: {
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        country: true,
        category: true,
        campaign: true
      }
    });
    
    console.log('Total Game Plans:', gamePlans.length);
    
    // Test 1: No filters (all data)
    console.log('\n1. NO FILTERS - All Data:');
    console.log('========================');
    let digitalBudget = 0;
    let traditionalBudget = 0;
    
    gamePlans.forEach(plan => {
      if (plan.mediaSubType?.mediaType) {
        const mediaType = plan.mediaSubType.mediaType.name;
        const budget = plan.totalBudget || 0;
        
        if (mediaType === 'Traditional') {
          traditionalBudget += budget;
        } else if (mediaType === 'Digital') {
          digitalBudget += budget;
        }
      }
    });
    
    const totalBudget = digitalBudget + traditionalBudget;
    const tvShare = totalBudget > 0 ? (traditionalBudget / totalBudget * 100).toFixed(1) : '0';
    
    console.log(`  Digital: $${digitalBudget}`);
    console.log(`  Traditional: $${traditionalBudget}`);
    console.log(`  Total: $${totalBudget}`);
    console.log(`  → TV Share: ${tvShare}%`);
    
    // Test 2: Filter by Digital only
    console.log('\n2. FILTER: Digital Media Type Only:');
    console.log('===================================');
    const digitalOnlyPlans = gamePlans.filter(plan => 
      plan.mediaSubType?.mediaType?.name === 'Digital'
    );
    
    let digitalOnlyBudget = 0;
    digitalOnlyPlans.forEach(plan => {
      digitalOnlyBudget += plan.totalBudget || 0;
    });
    
    console.log(`  Filtered Plans: ${digitalOnlyPlans.length}`);
    console.log(`  Digital: $${digitalOnlyBudget}`);
    console.log(`  Traditional: $0`);
    console.log(`  Total: $${digitalOnlyBudget}`);
    console.log(`  → TV Share: 0% (expected since only Digital selected)`);
    
    // Test 3: Filter by Traditional only
    console.log('\n3. FILTER: Traditional Media Type Only:');
    console.log('=======================================');
    const traditionalOnlyPlans = gamePlans.filter(plan => 
      plan.mediaSubType?.mediaType?.name === 'Traditional'
    );
    
    let traditionalOnlyBudget = 0;
    traditionalOnlyPlans.forEach(plan => {
      traditionalOnlyBudget += plan.totalBudget || 0;
    });
    
    console.log(`  Filtered Plans: ${traditionalOnlyPlans.length}`);
    console.log(`  Digital: $0`);
    console.log(`  Traditional: $${traditionalOnlyBudget}`);
    console.log(`  Total: $${traditionalOnlyBudget}`);
    console.log(`  → TV Share: 100% (expected since only Traditional selected)`);
    
    // Test 4: Filter by specific country (e.g., India)
    console.log('\n4. FILTER: India Country Only:');
    console.log('==============================');
    const indiaPlans = gamePlans.filter(plan => 
      plan.country?.name === 'India'
    );
    
    let indiaDigital = 0;
    let indiaTraditional = 0;
    
    indiaPlans.forEach(plan => {
      if (plan.mediaSubType?.mediaType) {
        const mediaType = plan.mediaSubType.mediaType.name;
        const budget = plan.totalBudget || 0;
        
        if (mediaType === 'Traditional') {
          indiaTraditional += budget;
        } else if (mediaType === 'Digital') {
          indiaDigital += budget;
        }
      }
    });
    
    const indiaTotal = indiaDigital + indiaTraditional;
    const indiaTvShare = indiaTotal > 0 ? (indiaTraditional / indiaTotal * 100).toFixed(1) : '0';
    
    console.log(`  Filtered Plans: ${indiaPlans.length}`);
    console.log(`  Digital: $${indiaDigital}`);
    console.log(`  Traditional: $${indiaTraditional}`);
    console.log(`  Total: $${indiaTotal}`);
    console.log(`  → TV Share: ${indiaTvShare}% (specific to India)`);
    
    // Test 5: Show what filters should display
    console.log('\n\n=== EXPECTED DASHBOARD BEHAVIOR ===');
    console.log('When filters are applied, the TV Share card should:');
    console.log('1. Update to reflect only the filtered data');
    console.log('2. Recalculate based on filtered Traditional vs Digital budgets');
    console.log('3. Show 0% if only Digital is selected');
    console.log('4. Show 100% if only Traditional is selected');
    console.log('5. Show the appropriate percentage for mixed selections\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFilterTVShare().catch(console.error);