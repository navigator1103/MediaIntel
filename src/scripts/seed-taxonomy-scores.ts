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

  // Current month and previous month
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Generate random scores for each country for current and previous month
  for (const country of countries) {
    // Current month scores
    const l1Score = Math.floor(Math.random() * 100);
    const l2Score = Math.floor(Math.random() * 100);
    const l3Score = Math.floor(Math.random() * 100);
    const averageScore = Math.round((l1Score + l2Score + l3Score) / 3);

    // Check if score already exists
    const existingScore = await prisma.taxonomyScore.findFirst({
      where: {
        countryId: country.id,
        month: currentMonth
      }
    });

    if (!existingScore) {
      await prisma.taxonomyScore.create({
        data: {
          countryId: country.id,
          month: currentMonth,
          l1Score,
          l2Score,
          l3Score,
          averageScore
        }
      });
      console.log(`Created taxonomy score for ${country.name} (${currentMonth})`);
    } else {
      console.log(`Score already exists for ${country.name} (${currentMonth})`);
    }

    // Previous month scores
    const prevL1Score = Math.floor(Math.random() * 100);
    const prevL2Score = Math.floor(Math.random() * 100);
    const prevL3Score = Math.floor(Math.random() * 100);
    const prevAverageScore = Math.round((prevL1Score + prevL2Score + prevL3Score) / 3);

    // Check if score already exists
    const existingPrevScore = await prisma.taxonomyScore.findFirst({
      where: {
        countryId: country.id,
        month: prevMonth
      }
    });

    if (!existingPrevScore) {
      await prisma.taxonomyScore.create({
        data: {
          countryId: country.id,
          month: prevMonth,
          l1Score: prevL1Score,
          l2Score: prevL2Score,
          l3Score: prevL3Score,
          averageScore: prevAverageScore
        }
      });
      console.log(`Created taxonomy score for ${country.name} (${prevMonth})`);
    } else {
      console.log(`Score already exists for ${country.name} (${prevMonth})`);
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
