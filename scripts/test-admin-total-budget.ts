import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminTotalBudget() {
  // Test what the admin dashboard shows for user@example.com
  const user = await prisma.user.findFirst({
    where: { email: 'user@example.com' }
  });
  
  console.log('=== Testing Total Budget for user@example.com ===');
  console.log('User role:', user?.role);
  console.log('Accessible countries:', user?.accessibleCountries);
  
  // The admin page calls /api/dashboard/media-sufficiency
  // Let's simulate what that returns
  
  // 1. First, check what getUserFromRequest would get
  // It needs the full user data with accessibleCountries
  
  let accessibleCountryIds: number[] = [];
  if (user?.accessibleCountries) {
    const parsed = typeof user.accessibleCountries === 'string' 
      ? JSON.parse(user.accessibleCountries)
      : user.accessibleCountries;
    
    if (typeof parsed === 'number') {
      accessibleCountryIds = [parsed];
    } else if (Array.isArray(parsed)) {
      accessibleCountryIds = parsed;
    }
  }
  
  console.log('Parsed accessible country IDs:', accessibleCountryIds);
  
  // 2. Build the where clause like the API does
  const whereClause: any = {};
  if (accessibleCountryIds.length > 0) {
    whereClause.countryId = { in: accessibleCountryIds };
  }
  
  console.log('Where clause:', whereClause);
  
  // 3. Get game plans with this filter
  const gamePlans = await prisma.gamePlan.findMany({
    where: whereClause,
    include: {
      campaign: true,
      country: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  console.log(`\nFiltered game plans: ${gamePlans.length}`);
  
  // 4. Calculate total budget (like the API does)
  let totalBudget = 0;
  gamePlans.forEach(plan => {
    const budget = plan.totalBudget || 0;
    totalBudget += budget;
    console.log(`  - ${plan.campaign?.name} (${plan.country?.name}): ${budget}`);
  });
  
  console.log(`\nTotal Budget (filtered): ${totalBudget}`);
  
  // 5. Compare with unfiltered total
  const allGamePlans = await prisma.gamePlan.findMany();
  let unfilteredTotal = 0;
  allGamePlans.forEach(plan => {
    unfilteredTotal += plan.totalBudget || 0;
  });
  
  console.log(`Total Budget (all game plans): ${unfilteredTotal}`);
  
  if (totalBudget === 0 && unfilteredTotal > 0) {
    console.log('\n⚠️  ISSUE: User with India access sees 0 budget but total exists!');
    console.log('This means filtering IS working correctly.');
    console.log('If the dashboard shows non-zero, the API might not be getting the auth token.');
  }
  
  await prisma.$disconnect();
}

testAdminTotalBudget().catch(console.error);