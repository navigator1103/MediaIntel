import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding taxonomy scores...');

  // Get all countries
  const countries = await prisma.country.findMany();
  
  if (countries.length === 0) {
    console.log('No countries found. Please seed countries first.');
    return;
  }

  // Get all brands
  const brands = await prisma.brand.findMany();
  
  if (brands.length === 0) {
    console.log('No brands found. Please seed brands first.');
    return;
  }

  // Define platforms
  const platforms = [
    'Meta',
    'Google DV360',
    'TikTok',
    'Amazon',
    'Pinterest'
  ];

  // Current month and previous month
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Additional months for historical data
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  console.log(`Generating taxonomy scores for months: ${months.join(', ')}`);

  // 1. Generate country-level scores for each month
  console.log('Generating country-level taxonomy scores...');
  for (const country of countries) {
    for (const month of months) {
      // Check if score already exists
      const existingScore = await prisma.taxonomyScore.findFirst({
        where: {
          countryId: country.id,
          month: month,
          brandId: null,
          platform: null
        }
      });

      if (!existingScore) {
        const l1Score = Math.floor(Math.random() * 100);
        const l2Score = Math.floor(Math.random() * 100);
        const l3Score = Math.floor(Math.random() * 100);
        const averageScore = Math.round((l1Score + l2Score + l3Score) / 3);

        await prisma.taxonomyScore.create({
          data: {
            countryId: country.id,
            month: month,
            l1Score,
            l2Score,
            l3Score,
            averageScore
          }
        });
        console.log(`Created country-level taxonomy score for ${country.name} (${month})`);
      } else {
        console.log(`Country-level score already exists for ${country.name} (${month})`);
      }
    }
  }

  // 2. Generate brand-specific scores for each country and month
  console.log('Generating brand-specific taxonomy scores...');
  for (const country of countries) {
    for (const brand of brands) {
      for (const month of months) {
        // Check if score already exists
        const existingScore = await prisma.taxonomyScore.findFirst({
          where: {
            countryId: country.id,
            brandId: brand.id,
            month: month,
            platform: null
          }
        });

        if (!existingScore) {
          const l1Score = Math.floor(Math.random() * 100);
          const l2Score = Math.floor(Math.random() * 100);
          const l3Score = Math.floor(Math.random() * 100);
          const averageScore = Math.round((l1Score + l2Score + l3Score) / 3);

          await prisma.taxonomyScore.create({
            data: {
              countryId: country.id,
              brandId: brand.id,
              month: month,
              l1Score,
              l2Score,
              l3Score,
              averageScore
            }
          });
          console.log(`Created brand-specific taxonomy score for ${country.name}, ${brand.name} (${month})`);
        } else {
          console.log(`Brand-specific score already exists for ${country.name}, ${brand.name} (${month})`);
        }
      }
    }
  }

  // 3. Generate platform-specific scores for each brand, country, and month
  console.log('Generating platform-specific taxonomy scores...');
  // Limit to a subset of countries and brands to avoid too many records
  const selectedCountries = countries.slice(0, 5); // Take first 5 countries
  const selectedBrands = brands.slice(0, 3); // Take first 3 brands

  for (const country of selectedCountries) {
    for (const brand of selectedBrands) {
      for (const platform of platforms) {
        for (const month of months) {
          // Check if score already exists
          const existingScore = await prisma.taxonomyScore.findFirst({
            where: {
              countryId: country.id,
              brandId: brand.id,
              platform: platform,
              month: month
            }
          });

          if (!existingScore) {
            const l1Score = Math.floor(Math.random() * 100);
            const l2Score = Math.floor(Math.random() * 100);
            const l3Score = Math.floor(Math.random() * 100);
            const averageScore = Math.round((l1Score + l2Score + l3Score) / 3);

            await prisma.taxonomyScore.create({
              data: {
                countryId: country.id,
                brandId: brand.id,
                platform: platform,
                month: month,
                l1Score,
                l2Score,
                l3Score,
                averageScore
              }
            });
            console.log(`Created platform-specific taxonomy score for ${country.name}, ${brand.name}, ${platform} (${month})`);
          } else {
            console.log(`Platform-specific score already exists for ${country.name}, ${brand.name}, ${platform} (${month})`);
          }
        }
      }
    }
  }

  console.log('Seeding taxonomy scores completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
