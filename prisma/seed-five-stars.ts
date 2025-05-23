import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 5 Stars data...');

  // Create criteria
  const criteria = [
    {
      name: 'Creative Quality',
      description: 'Assessment of the creative execution and design',
    },
    {
      name: 'Brand Alignment',
      description: 'How well the content aligns with brand guidelines',
    },
    {
      name: 'Audience Targeting',
      description: 'Effectiveness of targeting the right audience',
    },
    {
      name: 'Media Efficiency',
      description: 'Cost-effectiveness of the media placement',
    },
    {
      name: 'Performance Metrics',
      description: 'Achievement of KPIs and performance goals',
    },
  ];

  // Create the criteria in the database
  const createdCriteria = [];
  for (const criterion of criteria) {
    const created = await prisma.fiveStarsCriterion.create({
      data: criterion,
    });
    createdCriteria.push(created);
    console.log(`Created criterion: ${created.name} (ID: ${created.id})`);
  }

  // Get countries and brands from the database
  const countries = await prisma.country.findMany();
  const brands = await prisma.brand.findMany();

  if (countries.length === 0) {
    console.error('No countries found in the database. Please seed countries first.');
    return;
  }

  if (brands.length === 0) {
    console.error('No brands found in the database. Please seed brands first.');
    return;
  }

  // Months to seed data for
  const months = ['2025-03', '2025-02'];

  // Generate ratings for each country, brand, criterion, and month
  for (const country of countries) {
    for (const brand of brands) {
      for (const criterion of createdCriteria) {
        for (const month of months) {
          // Generate a random rating between 1 and 5
          const rating = Math.floor(Math.random() * 5) + 1;
          
          // Create the rating
          await prisma.fiveStarsRating.create({
            data: {
              criterionId: criterion.id,
              countryId: country.id,
              brandId: brand.id,
              rating,
              month,
              comments: `${month} rating for ${criterion.name} in ${country.name} for ${brand.name}`,
            },
          });
          
          console.log(`Created rating for ${country.name} - ${brand.name} - ${criterion.name} - ${month}: ${rating} stars`);
        }
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
