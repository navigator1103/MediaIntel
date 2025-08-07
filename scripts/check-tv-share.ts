import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTVShare() {
  console.log('\n=== Checking TV Share Data ===\n');
  
  try {
    // 1. Check all media types
    const mediaTypes = await prisma.mediaType.findMany({
      include: {
        mediaSubTypes: true
      }
    });
    
    console.log('Media Types in Database:');
    mediaTypes.forEach(mt => {
      console.log(`  ${mt.name} (ID: ${mt.id})`);
      mt.mediaSubTypes.forEach(st => {
        console.log(`    - ${st.name} (ID: ${st.id})`);
      });
    });
    
    // 2. Check game plans by media type
    const gamePlans = await prisma.gamePlan.findMany({
      include: {
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        campaign: true
      }
    });
    
    console.log('\n\nGame Plans by Media Type:');
    const budgetByMediaType: Record<string, number> = {};
    
    gamePlans.forEach(gp => {
      if (gp.mediaSubType?.mediaType) {
        const mediaTypeName = gp.mediaSubType.mediaType.name;
        const budget = gp.totalBudget || 0;
        
        if (!budgetByMediaType[mediaTypeName]) {
          budgetByMediaType[mediaTypeName] = 0;
        }
        budgetByMediaType[mediaTypeName] += budget;
      }
    });
    
    Object.entries(budgetByMediaType).forEach(([type, budget]) => {
      console.log(`  ${type}: $${budget.toLocaleString()}`);
    });
    
    // 3. Calculate TV share percentage
    const totalBudget = Object.values(budgetByMediaType).reduce((sum, budget) => sum + budget, 0);
    const tvBudget = budgetByMediaType['TV'] || budgetByMediaType['Traditional'] || 0;
    const tvShare = totalBudget > 0 ? (tvBudget / totalBudget * 100).toFixed(1) : 0;
    
    console.log('\n\nTV Share Calculation:');
    console.log(`  Total Budget: $${totalBudget.toLocaleString()}`);
    console.log(`  TV/Traditional Budget: $${tvBudget.toLocaleString()}`);
    console.log(`  TV Share: ${tvShare}%`);
    
    // 4. List specific TV campaigns
    console.log('\n\nTV/Traditional Campaigns:');
    const tvCampaigns = gamePlans.filter(gp => 
      gp.mediaSubType?.mediaType && (
        gp.mediaSubType.mediaType.name === 'TV' || 
        gp.mediaSubType.mediaType.name === 'Traditional'
      )
    );
    
    if (tvCampaigns.length === 0) {
      console.log('  No TV/Traditional campaigns found');
    } else {
      tvCampaigns.forEach(gp => {
        console.log(`  - ${gp.campaign.name}: $${gp.totalBudget?.toLocaleString() || 0} (${gp.mediaSubType.name})`);
      });
    }
    
    // 5. Check what the API returns
    console.log('\n\nChecking API Response:');
    const axios = require('axios');
    
    try {
      const response = await axios.get('http://localhost:3001/api/dashboard/media-sufficiency', {
        headers: {
          'Authorization': 'Bearer test'
        }
      });
      
      if (response.data) {
        console.log('  API Budget by Media Type:');
        Object.entries(response.data.budgetByMediaType || {}).forEach(([type, budget]) => {
          console.log(`    ${type}: $${(budget as number).toLocaleString()}`);
        });
        
        console.log('\n  API Summary:');
        console.log(`    Total Budget: $${response.data.summary?.totalBudget?.toLocaleString() || 0}`);
      }
    } catch (error: any) {
      console.log('  Could not fetch API data:', error.message || error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTVShare().catch(console.error);