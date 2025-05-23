import { PrismaClient } from '@prisma/client';
import { seedDummyMediaData } from './seed-dummy-media-data';
import { seedCategoriesAndRanges } from './seed-categories-ranges';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding database...');

    // Create admin user with simple password
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: '$2b$10$Xq3Ev9.guViZSlrDTV8Srunqm1JyVd/YecCycdqFN1ahEyXLkpTnu' // hashed 'admin'
      },
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: '$2b$10$Xq3Ev9.guViZSlrDTV8Srunqm1JyVd/YecCycdqFN1ahEyXLkpTnu', // hashed 'admin'
        role: 'admin'
      }
    });

    // Create regular user with simple password
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {
        password: '$2b$10$yuV2.AwQ2u7iF/MSS/cGdeKhwYKEYTJzUKcpxXTkh1FFTUqxzU6Ri' // hashed 'user'
      },
      create: {
        email: 'user@example.com',
        name: 'Regular User',
        password: '$2b$10$yuV2.AwQ2u7iF/MSS/cGdeKhwYKEYTJzUKcpxXTkh1FFTUqxzU6Ri', // hashed 'user'
        role: 'user'
      }
    });

    console.log('Created admin and regular users');

    // Create regions
    const emea = await prisma.region.upsert({
      where: { name: 'EMEA' },
      update: {},
      create: {
        name: 'EMEA'
      }
    });

    const apac = await prisma.region.upsert({
      where: { name: 'APAC' },
      update: {},
      create: {
        name: 'APAC'
      }
    });

    const americas = await prisma.region.upsert({
      where: { name: 'Americas' },
      update: {},
      create: {
        name: 'Americas'
      }
    });

    console.log('Created regions');

    // Create countries
    const uk = await prisma.country.upsert({
      where: { name: 'United Kingdom' },
      update: { regionId: emea.id },
      create: {
        name: 'United Kingdom',
        regionId: emea.id
      }
    });

    const france = await prisma.country.upsert({
      where: { name: 'France' },
      update: { regionId: emea.id },
      create: {
        name: 'France',
        regionId: emea.id
      }
    });

    const germany = await prisma.country.upsert({
      where: { name: 'Germany' },
      update: { regionId: emea.id },
      create: {
        name: 'Germany',
        regionId: emea.id
      }
    });

    const australia = await prisma.country.upsert({
      where: { name: 'Australia' },
      update: { regionId: apac.id },
      create: {
        name: 'Australia',
        regionId: apac.id
      }
    });

    const usa = await prisma.country.upsert({
      where: { name: 'United States' },
      update: { regionId: americas.id },
      create: {
        name: 'United States',
        regionId: americas.id
      }
    });

    console.log('Created countries');

    // Create brands
    const brand1 = await prisma.brand.upsert({
      where: { name: 'Nivea' },
      update: {},
      create: {
        name: 'Nivea'
      }
    });

    const brand2 = await prisma.brand.upsert({
      where: { name: 'Eucerin' },
      update: {},
      create: {
        name: 'Eucerin'
      }
    });

    const brand3 = await prisma.brand.upsert({
      where: { name: 'Labello' },
      update: {},
      create: {
        name: 'Labello'
      }
    });

    console.log('Created brands');

    // Create rules
    const rule1 = await prisma.rule.upsert({
      where: {
        id: 1
      },
      update: {},
      create: {
        platform: 'Meta',
        title: 'Proper Account Structure',
        description: 'Accounts should follow the recommended structure with proper campaign naming conventions',
        category: 'Account Structure',
        status: 'active',
        priority: 'high'
      }
    });

    const rule2 = await prisma.rule.upsert({
      where: {
        id: 2
      },
      update: {},
      create: {
        platform: 'Google Ads',
        title: 'Conversion Tracking',
        description: 'All accounts must have proper conversion tracking set up',
        category: 'Tracking',
        status: 'active',
        priority: 'high'
      }
    });

    const rule3 = await prisma.rule.upsert({
      where: {
        id: 3
      },
      update: {},
      create: {
        platform: 'TikTok',
        title: 'Creative Aspect Ratios',
        description: 'All creatives should follow platform recommended aspect ratios',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      }
    });

    const rule4 = await prisma.rule.upsert({
      where: {
        id: 4
      },
      update: {},
      create: {
        platform: 'DV360',
        title: 'Frequency Capping',
        description: 'All campaigns should have appropriate frequency caps set',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      }
    });

    const rule5 = await prisma.rule.upsert({
      where: {
        id: 5
      },
      update: {},
      create: {
        platform: 'Meta',
        title: 'Audience Segmentation',
        description: 'Campaigns should use proper audience segmentation',
        category: 'Targeting',
        status: 'active',
        priority: 'medium'
      }
    });

    console.log('Created rules');

    // Create scores
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Check if scores already exist
    const existingScoresCount = await prisma.score.count();
    
    if (existingScoresCount === 0) {
      // For each rule, create scores for different countries and brands
      const rules = [rule1, rule2, rule3, rule4, rule5];
      const countries = [uk, france, germany, australia, usa];
      const brands = [brand1, brand2, brand3];

      for (const rule of rules) {
        for (const country of countries) {
          for (const brand of brands) {
            // Generate a random score between 50 and 100
            const score = Math.floor(Math.random() * 51) + 50;
            
            await prisma.score.create({
              data: {
                ruleId: rule.id,
                platform: rule.platform,
                countryId: country.id,
                brandId: brand.id,
                score,
                trend: Math.floor(Math.random() * 11) - 5, // Random trend between -5 and +5
                month: currentMonth,
                evaluation: score >= 80 ? 'Good' : score >= 60 ? 'Average' : 'Poor'
              }
            });
          }
        }
      }
      console.log('Created scores');
    } else {
      console.log(`Skipping score creation, ${existingScoresCount} scores already exist`);
    }

    console.log('Created scores');

    // Create some change requests
    const scores = await prisma.score.findMany({
      take: 5,
      where: {
        score: {
          lt: 80
        }
      }
    });

    for (const score of scores) {
      const requestedScore = score.score + 15;
      
      await prisma.changeRequest.create({
        data: {
          scoreId: score.id,
          requestedScore,
          comments: `Request to increase score from ${score.score} to ${requestedScore} based on recent improvements`,
          status: 'Submitted for Review'
        }
      });
    }

    console.log('Created change requests');
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function runSeed() {
  try {
    await main();
    await seedDummyMediaData();
    await seedCategoriesAndRanges(); // Add our new categories and ranges seeding function
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
