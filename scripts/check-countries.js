// Script to check countries in the database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all countries
    const countries = await prisma.country.findMany({
      include: {
        region: true
      }
    });
    console.log('Current countries in database:');
    console.table(countries.map(country => ({
      id: country.id,
      name: country.name,
      code: country.code,
      regionId: country.regionId,
      regionName: country.region?.name || 'No Region',
      createdAt: country.createdAt
    })));
    
    // Get all platforms from rules
    const rules = await prisma.rule.findMany({
      select: {
        platform: true
      },
      distinct: ['platform']
    });
    
    const platforms = rules.map(rule => rule.platform);
    console.log('Platforms in rules:');
    console.table(platforms);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
