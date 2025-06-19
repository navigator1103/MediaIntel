import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugGamePlans() {
  try {
    console.log('🔍 Debugging game plans...');
    
    // Get all game plans with their relationships
    const gamePlans = await prisma.gamePlan.findMany({
      include: {
        country: true,
        lastUpdate: true,
        campaign: true,
        mediaSubType: true
      }
    });
    
    console.log(`📊 Total game plans: ${gamePlans.length}`);
    
    if (gamePlans.length > 0) {
      console.log('\n📋 Game plans breakdown:');
      
      // Group by country and lastUpdate
      const groupedByCountry = gamePlans.reduce((acc, plan) => {
        const countryName = plan.country?.name || 'Unknown';
        const lastUpdateName = plan.lastUpdate?.name || 'Unknown';
        const key = `${countryName} - ${lastUpdateName}`;
        
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(plan);
        return acc;
      }, {} as Record<string, any[]>);
      
      Object.entries(groupedByCountry).forEach(([key, plans]) => {
        console.log(`  ${key}: ${plans.length} records`);
        plans.forEach(plan => {
          console.log(`    - ID: ${plan.id}, Campaign: ${plan.campaign?.name}, last_update_id: ${plan.last_update_id}`);
        });
      });
      
      // Check last update IDs
      console.log('\n🔢 Last Update ID distribution:');
      const lastUpdateIds = gamePlans.map(plan => plan.last_update_id);
      const uniqueLastUpdateIds = [...new Set(lastUpdateIds)];
      uniqueLastUpdateIds.forEach(id => {
        const count = lastUpdateIds.filter(x => x === id).length;
        console.log(`  last_update_id ${id}: ${count} records`);
      });
      
      // Check countries
      console.log('\n🌍 Country distribution:');
      const countryIds = gamePlans.map(plan => plan.countryId);
      const uniqueCountryIds = [...new Set(countryIds)];
      uniqueCountryIds.forEach(id => {
        const count = countryIds.filter(x => x === id).length;
        const countryName = gamePlans.find(p => p.countryId === id)?.country?.name || 'Unknown';
        console.log(`  ${countryName} (ID: ${id}): ${count} records`);
      });
    }
    
    // Check LastUpdate table
    console.log('\n📅 Available Last Updates:');
    const lastUpdates = await prisma.lastUpdate.findMany();
    lastUpdates.forEach(lu => {
      console.log(`  ID: ${lu.id}, Name: ${lu.name}`);
    });
    
    // Check Countries
    console.log('\n🗺️ Available Countries:');
    const countries = await prisma.country.findMany();
    countries.forEach(country => {
      console.log(`  ID: ${country.id}, Name: ${country.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging game plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGamePlans();