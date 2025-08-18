import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFinancialCycles() {
  try {
    console.log('=== Financial Cycles Analysis ===\n');
    
    // Get all game plans with relevant financial cycle data
    const gamePlans = await prisma.gamePlan.findMany({
      select: {
        id: true,
        year: true,
        playbookId: true,
        lastUpdateId: true,
        totalBudget: true,
        campaign: {
          select: { name: true }
        },
        country: {
          select: { name: true }
        },
        lastUpdate: {
          select: { name: true }
        }
      },
      orderBy: [
        { year: 'desc' },
        { lastUpdateId: 'desc' }
      ]
    });

    console.log(`Total Game Plans: ${gamePlans.length}\n`);

    // Group by year
    const byYear = gamePlans.reduce((acc, plan) => {
      const year = plan.year || 'Unknown';
      if (!acc[year]) acc[year] = [];
      acc[year].push(plan);
      return acc;
    }, {} as Record<string, typeof gamePlans>);

    console.log('=== By Year ===');
    Object.entries(byYear).forEach(([year, plans]) => {
      const totalBudget = plans.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
      console.log(`${year}: ${plans.length} plans, Budget: ${totalBudget.toLocaleString()}`);
    });

    // Group by last update (financial cycle indicator)
    const byLastUpdate = gamePlans.reduce((acc, plan) => {
      const update = plan.lastUpdate?.name || 'No Update';
      if (!acc[update]) acc[update] = [];
      acc[update].push(plan);
      return acc;
    }, {} as Record<string, typeof gamePlans>);

    console.log('\n=== By Last Update (Financial Cycles) ===');
    Object.entries(byLastUpdate).forEach(([update, plans]) => {
      const totalBudget = plans.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
      const countries = new Set(plans.map(p => p.country?.name).filter(Boolean));
      console.log(`${update}: ${plans.length} plans, Budget: ${totalBudget.toLocaleString()}, Countries: ${countries.size}`);
    });

    // Group by playbook (another financial cycle indicator)
    const byPlaybook = gamePlans.reduce((acc, plan) => {
      const playbook = plan.playbookId || 'No Playbook';
      if (!acc[playbook]) acc[playbook] = [];
      acc[playbook].push(plan);
      return acc;
    }, {} as Record<string, typeof gamePlans>);

    console.log('\n=== By Playbook ===');
    Object.entries(byPlaybook).forEach(([playbook, plans]) => {
      const totalBudget = plans.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
      console.log(`${playbook}: ${plans.length} plans, Budget: ${totalBudget.toLocaleString()}`);
    });

    // Show distinct last updates
    const lastUpdates = await prisma.lastUpdate.findMany({
      select: { id: true, name: true }
    });

    console.log('\n=== Available Last Updates ===');
    lastUpdates.forEach(update => {
      console.log(`ID: ${update.id}, Name: ${update.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinancialCycles();