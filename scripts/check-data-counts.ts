import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataCounts() {
  try {
    const gamePlansCount = await prisma.gamePlan.count();
    const campaignsCount = await prisma.campaign.count();
    const categoriesCount = await prisma.category.count();
    const rangesCount = await prisma.range.count();
    const countriesCount = await prisma.country.count();
    const mediaSufficiencyCount = await prisma.mediaSufficiency.count();
    const usersCount = await prisma.user.count();

    console.log('=== Database Counts ===');
    console.log('Game Plans:', gamePlansCount);
    console.log('Campaigns:', campaignsCount);
    console.log('Categories:', categoriesCount);
    console.log('Ranges:', rangesCount);
    console.log('Countries:', countriesCount);
    console.log('Media Sufficiency Records:', mediaSufficiencyCount);
    console.log('Users:', usersCount);
  } catch (error) {
    console.error('Error checking data counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataCounts();