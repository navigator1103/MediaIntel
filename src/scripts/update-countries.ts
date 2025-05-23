import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCountries() {
  try {
    console.log('Starting country update...');
    
    // Define the new countries
    const newCountries = [
      { id: 1, name: 'Brazil', regionId: 1 },
      { id: 2, name: 'India', regionId: 2 },
      { id: 3, name: 'South Africa', regionId: 3 },
      { id: 4, name: 'Mexico', regionId: 1 },
      { id: 5, name: 'Chile', regionId: 1 },
      { id: 6, name: 'Thailand', regionId: 2 }
    ];
    
    // Update each country
    for (const country of newCountries) {
      // Check if country exists
      const existingCountry = await prisma.country.findUnique({
        where: { id: country.id }
      });
      
      if (existingCountry) {
        // Update existing country
        await prisma.country.update({
          where: { id: country.id },
          data: {
            name: country.name,
            regionId: country.regionId
          }
        });
        console.log(`Updated country: ${country.name}`);
      } else {
        // Create new country
        await prisma.country.create({
          data: country
        });
        console.log(`Created country: ${country.name}`);
      }
    }
    
    console.log('Country update completed successfully!');
  } catch (error) {
    console.error('Error updating countries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateCountries();
