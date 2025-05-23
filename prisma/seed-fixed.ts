import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with basic data...');

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

  const latam = await prisma.region.upsert({
    where: { name: 'LATAM' },
    update: {},
    create: {
      name: 'LATAM'
    }
  });

  const na = await prisma.region.upsert({
    where: { name: 'NA' },
    update: {},
    create: {
      name: 'NA'
    }
  });

  console.log('Created regions');

  // Create countries
  const countries = [
    { name: 'Germany', code: 'DE', regionId: emea.id },
    { name: 'United Kingdom', code: 'UK', regionId: emea.id },
    { name: 'France', code: 'FR', regionId: emea.id },
    { name: 'Italy', code: 'IT', regionId: emea.id },
    { name: 'Spain', code: 'ES', regionId: emea.id },
    { name: 'India', code: 'IN', regionId: apac.id },
    { name: 'China', code: 'CN', regionId: apac.id },
    { name: 'Japan', code: 'JP', regionId: apac.id },
    { name: 'Australia', code: 'AU', regionId: apac.id },
    { name: 'Brazil', code: 'BR', regionId: latam.id },
    { name: 'Mexico', code: 'MX', regionId: latam.id },
    { name: 'Argentina', code: 'AR', regionId: latam.id },
    { name: 'United States', code: 'US', regionId: na.id },
    { name: 'Canada', code: 'CA', regionId: na.id }
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {
        name: country.name,
        regionId: country.regionId
      },
      create: {
        name: country.name,
        code: country.code,
        regionId: country.regionId
      }
    });
  }

  console.log('Created countries');

  // Create brands
  const brands = [
    { name: 'NIVEA', code: 'NV' },
    { name: 'Eucerin', code: 'EU' },
    { name: 'Labello', code: 'LB' },
    { name: 'Hansaplast', code: 'HP' },
    { name: 'La Prairie', code: 'LP' }
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { code: brand.code },
      update: {
        name: brand.name
      },
      create: {
        name: brand.name,
        code: brand.code
      }
    });
  }

  console.log('Created brands');

  // Seed categories and ranges
  const categoriesWithRanges = [
    {
      name: 'Face Care',
      ranges: ['Cellular', 'Epigenetics', 'Facial', 'Luminous 630', 'Q10', 'Rose Care']
    },
    {
      name: 'Hand Body',
      ranges: [
        'Aloe', 'Crème', 'Deep', 'Even Tone Care', 'Luminous 630', 'Milk', 
        'Natural Glow', 'Ozoino', 'Q10', 'Radiant Beauty', 'Repair & Care', 
        'Soft', 'Vitamin Range', 'Vitamin Serum'
      ]
    },
    {
      name: 'Face Cleansing',
      ranges: ['Acne', 'Daily Essentials', 'Luminous 630', 'Micellar']
    },
    {
      name: 'Sun',
      ranges: ['Protect & Moisture', 'Sun', 'UV Face']
    },
    {
      name: 'Men',
      ranges: ['Acne', 'Extra Bright', 'Men', 'Sensitive']
    },
    {
      name: 'Deo',
      ranges: [
        'Black & White', 'Deep', 'Cool Kick', 'Deo Male', 
        'Even Tone', 'Hijab Fresh', 'Pearl & Beauty', 'Skin Hero'
      ]
    },
    {
      name: 'Lip',
      ranges: ['All', 'Lip']
    },
    {
      name: 'X-Cat',
      ranges: ['All']
    }
  ];
  
  // Create categories and ranges
  for (const category of categoriesWithRanges) {
    const createdCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: { name: category.name }
    });
    
    console.log(`Created Category: ${category.name}`);
    
    // Create ranges for this category
    for (const rangeName of category.ranges) {
      await prisma.range.create({
        data: {
          name: rangeName,
          category: { connect: { id: createdCategory.id } }
        }
      });
      console.log(`Created Range: ${rangeName} for Category: ${category.name}`);
    }
  }

  // Generate some sample taxonomy scores
  const platforms = ['Meta', 'Google DV360', 'TikTok', 'Amazon', 'Pinterest'];
  const countries = await prisma.country.findMany();
  const brands = await prisma.brand.findMany();
  
  // Current month and previous months
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  
  console.log(`Generating taxonomy scores for months: ${months.join(', ')}`);

  // Generate country-level scores
  for (const country of countries) {
    for (const month of months) {
      for (const platform of platforms) {
        await prisma.taxonomyScore.create({
          data: {
            countryId: country.id,
            platform,
            month,
            score: Math.floor(Math.random() * 100),
            previousScore: Math.floor(Math.random() * 100),
            status: Math.random() > 0.7 ? 'warning' : Math.random() > 0.4 ? 'success' : 'danger'
          }
        });
      }
    }
  }
  
  // Generate brand-level scores
  for (const country of countries) {
    for (const brand of brands) {
      for (const month of months) {
        for (const platform of platforms) {
          await prisma.taxonomyScore.create({
            data: {
              countryId: country.id,
              brandId: brand.id,
              platform,
              month,
              score: Math.floor(Math.random() * 100),
              previousScore: Math.floor(Math.random() * 100),
              status: Math.random() > 0.7 ? 'warning' : Math.random() > 0.4 ? 'success' : 'danger'
            }
          });
        }
      }
    }
  }

  console.log('Created taxonomy scores');

  // Create some campaigns
  const ranges = await prisma.range.findMany();
  const campaignNames = [
    'Summer Campaign 2025', 'Winter Promotion', 'Spring Launch', 
    'Holiday Special', 'Back to School', 'New Year New You',
    'Valentine\'s Day', 'Mother\'s Day', 'Father\'s Day'
  ];
  
  for (let i = 0; i < 20; i++) {
    const randomRange = ranges[Math.floor(Math.random() * ranges.length)];
    const randomName = campaignNames[Math.floor(Math.random() * campaignNames.length)];
    
    await prisma.campaign.create({
      data: {
        name: `${randomName} ${i + 1}`,
        rangeId: randomRange.id,
        status: Math.random() > 0.7 ? 'Approved' : Math.random() > 0.4 ? 'Pending' : 'Rejected',
        startDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        endDate: new Date(2025, Math.floor(Math.random() * 12) + 6, Math.floor(Math.random() * 28) + 1),
      }
    });
  }
  
  console.log('Created campaigns');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
