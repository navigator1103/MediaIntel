import { prisma } from '../src/lib/prisma';

async function validateCountries() {
  console.log('🌍 Validating Countries in Database\n');
  
  // Get all countries with their relationships
  const countries = await prisma.country.findMany({
    include: {
      region: true,
      subRegion: true,
      cluster: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  console.log(`Found ${countries.length} countries in database:\n`);
  
  countries.forEach((country, i) => {
    console.log(`${i + 1}. ${country.name}`);
    console.log(`   Region: ${country.region?.name || 'N/A'}`);
    console.log(`   Sub-Region: ${country.subRegion?.name || 'N/A'}`);
    console.log(`   Cluster: ${country.cluster?.name || 'N/A'}`);
    console.log('');
  });
  
  // Check for any game plans with countries
  console.log('🎯 Checking game plans by country:\n');
  
  const gamePlansWithCountries = await prisma.gamePlan.findMany({
    include: {
      country: true
    },
    orderBy: {
      country: {
        name: 'asc'
      }
    }
  });
  
  // Get unique countries from game plans
  const uniqueCountriesMap = new Map();
  gamePlansWithCountries.forEach(gp => {
    if (gp.country) {
      uniqueCountriesMap.set(gp.country.id, gp.country.name);
    }
  });
  
  const countriesWithGamePlans = Array.from(uniqueCountriesMap.values());
  console.log(`Countries with game plans (${countriesWithGamePlans.length}):`);
  countriesWithGamePlans.forEach((country, i) => {
    console.log(`${i + 1}. ${country}`);
  });
  
  // Check for any missing countries
  const allCountryNames = countries.map(c => c.name);
  const missingFromGamePlans = allCountryNames.filter(name => !countriesWithGamePlans.includes(name));
  
  if (missingFromGamePlans.length > 0) {
    console.log(`\n⚠️  Countries in database but no game plans (${missingFromGamePlans.length}):`);
    missingFromGamePlans.forEach((country, i) => {
      console.log(`${i + 1}. ${country}`);
    });
  }
  
  // Check regions and sub-regions
  console.log('\n🗺️  Regional breakdown:\n');
  
  const regions = await prisma.region.findMany({
    include: {
      countries: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  regions.forEach(region => {
    console.log(`Region: ${region.name} (${region.countries.length} countries)`);
    region.countries.forEach(country => {
      console.log(`  - ${country.name}`);
    });
    console.log('');
  });
  
  await prisma.$disconnect();
}

validateCountries().catch(console.error);