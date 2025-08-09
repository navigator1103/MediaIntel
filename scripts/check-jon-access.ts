import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJonAccess() {
  // Check jon@gmail.com
  const user = await prisma.user.findFirst({
    where: { email: 'jon@gmail.com' }
  });
  
  if (!user) {
    console.log('User jon@gmail.com not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log('=== User: jon@gmail.com ===');
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Role:', user.role);
  console.log('Accessible Countries (raw):', user.accessibleCountries);
  
  // Parse accessible countries
  let accessibleCountryIds: number[] = [];
  if (user.accessibleCountries) {
    try {
      const parsed = typeof user.accessibleCountries === 'string' 
        ? JSON.parse(user.accessibleCountries)
        : user.accessibleCountries;
      
      if (typeof parsed === 'number') {
        accessibleCountryIds = [parsed];
      } else if (Array.isArray(parsed)) {
        accessibleCountryIds = parsed;
      }
    } catch (e) {
      console.log('Error parsing:', e);
    }
  }
  
  console.log('Parsed Country IDs:', accessibleCountryIds);
  
  // Get country names
  if (accessibleCountryIds.length > 0) {
    const countries = await prisma.country.findMany({
      where: { id: { in: accessibleCountryIds } }
    });
    console.log('Accessible Countries:', countries.map(c => c.name).join(', '));
  } else {
    console.log('Accessible Countries: ALL (no restrictions)');
  }
  
  // Check what game plans jon should see
  const whereClause: any = {};
  if (accessibleCountryIds.length > 0) {
    whereClause.countryId = { in: accessibleCountryIds };
  }
  
  const gamePlans = await prisma.gamePlan.findMany({
    where: whereClause,
    include: {
      campaign: true,
      country: true
    }
  });
  
  console.log('\n=== What jon@gmail.com should see ===');
  console.log('Game Plans:', gamePlans.length);
  
  // Calculate total budget
  let totalBudget = 0;
  const countriesInPlans = new Set<string>();
  gamePlans.forEach(gp => {
    totalBudget += gp.totalBudget || 0;
    if (gp.country?.name) countriesInPlans.add(gp.country.name);
  });
  
  console.log('Total Budget:', totalBudget);
  console.log('Countries in game plans:', Array.from(countriesInPlans).join(', ') || 'none');
  
  // Compare with all game plans
  const allGamePlans = await prisma.gamePlan.findMany();
  let allBudget = 0;
  allGamePlans.forEach(gp => {
    allBudget += gp.totalBudget || 0;
  });
  
  console.log('\n=== Comparison ===');
  console.log('Jon should see budget:', totalBudget);
  console.log('Total budget (all game plans):', allBudget);
  
  if (totalBudget === allBudget && accessibleCountryIds.length > 0) {
    console.log('\n⚠️  ISSUE: Jon sees all budget despite having country restrictions!');
  } else if (totalBudget < allBudget && accessibleCountryIds.length > 0) {
    console.log('\n✅ CORRECT: Jon sees filtered budget based on country access');
  } else if (accessibleCountryIds.length === 0) {
    console.log('\n✅ CORRECT: Jon has no country restrictions, sees all budget');
  }
  
  // Check MediaSufficiency records
  const mediaSufficiency = await prisma.mediaSufficiency.findMany({
    where: whereClause
  });
  
  console.log('\n=== MediaSufficiency ===');
  console.log('Records jon should see:', mediaSufficiency.length);
  if (mediaSufficiency.length > 0) {
    mediaSufficiency.forEach(ms => {
      console.log(`  - ${ms.campaign} (${ms.country})`);
    });
  }
  
  await prisma.$disconnect();
}

checkJonAccess().catch(console.error);