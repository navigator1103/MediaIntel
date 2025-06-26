import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding basic data for dropdowns...');

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: '$2b$10$Xq3Ev9.guViZSlrDTV8Srunqm1JyVd/YecCycdqFN1ahEyXLkpTnu', // hashed 'admin'
        role: 'admin',
      },
    });

    console.log('Created admin user');

    // Create regions
    const region1 = await prisma.region.upsert({
      where: { name: 'Europe' },
      update: {},
      create: { name: 'Europe' },
    });

    const region2 = await prisma.region.upsert({
      where: { name: 'North America' },
      update: {},
      create: { name: 'North America' },
    });

    console.log('Created regions');

    // Create sub-regions
    const subRegion1 = await prisma.subRegion.upsert({
      where: { name: 'Western Europe' },
      update: {},
      create: { name: 'Western Europe' },
    });

    const subRegion2 = await prisma.subRegion.upsert({
      where: { name: 'Eastern Europe' },
      update: {},
      create: { name: 'Eastern Europe' },
    });

    console.log('Created sub-regions');

    // Create clusters
    const cluster1 = await prisma.cluster.upsert({
      where: { name: 'Cluster A' },
      update: {},
      create: { name: 'Cluster A' },
    });

    console.log('Created clusters');

    // Create countries
    const countries = [
      { name: 'Germany', regionId: region1.id, subRegionId: subRegion1.id, clusterId: cluster1.id },
      { name: 'France', regionId: region1.id, subRegionId: subRegion1.id, clusterId: cluster1.id },
      { name: 'UK', regionId: region1.id, subRegionId: subRegion1.id, clusterId: cluster1.id },
      { name: 'Spain', regionId: region1.id, subRegionId: subRegion1.id, clusterId: cluster1.id },
      { name: 'Italy', regionId: region1.id, subRegionId: subRegion1.id, clusterId: cluster1.id },
      { name: 'Poland', regionId: region1.id, subRegionId: subRegion2.id, clusterId: cluster1.id },
    ];

    for (const country of countries) {
      await prisma.country.upsert({
        where: { name: country.name },
        update: {},
        create: country,
      });
    }

    console.log('Created countries');

    // Create last updates (financial cycles)
    const lastUpdates = [
      { name: 'Q1 2024' },
      { name: 'Q2 2024' },
      { name: 'Q3 2024' },
      { name: 'Q4 2024' },
      { name: 'Q1 2025' },
    ];

    for (const update of lastUpdates) {
      await prisma.lastUpdate.upsert({
        where: { name: update.name },
        update: {},
        create: update,
      });
    }

    console.log('Created last updates');

    // Create categories
    const categories = [
      { name: 'Hair Care' },
      { name: 'Skin Care' },
      { name: 'Body Care' },
      { name: 'Sun Care' },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }

    console.log('Created categories');

    // Create ranges
    const ranges = [
      { name: 'Premium' },
      { name: 'Mass Market' },
      { name: 'Professional' },
    ];

    for (const range of ranges) {
      await prisma.range.upsert({
        where: { name: range.name },
        update: {},
        create: range,
      });
    }

    console.log('Created ranges');

    // Create media types
    const mediaTypes = [
      { name: 'TV' },
      { name: 'Digital' },
      { name: 'Print' },
      { name: 'Radio' },
      { name: 'OOH' },
    ];

    for (const mediaType of mediaTypes) {
      await prisma.mediaType.upsert({
        where: { name: mediaType.name },
        update: {},
        create: mediaType,
      });
    }

    console.log('Created media types');

    // Create media subtypes
    const tvMediaType = await prisma.mediaType.findUnique({ where: { name: 'TV' } });
    const digitalMediaType = await prisma.mediaType.findUnique({ where: { name: 'Digital' } });

    if (tvMediaType) {
      const tvSubtypes = [
        { name: 'Linear TV', mediaTypeId: tvMediaType.id },
        { name: 'Connected TV', mediaTypeId: tvMediaType.id },
      ];

      for (const subtype of tvSubtypes) {
        await prisma.mediaSubType.upsert({
          where: { name: subtype.name },
          update: {},
          create: subtype,
        });
      }
    }

    if (digitalMediaType) {
      const digitalSubtypes = [
        { name: 'Social Media', mediaTypeId: digitalMediaType.id },
        { name: 'Search', mediaTypeId: digitalMediaType.id },
        { name: 'Display', mediaTypeId: digitalMediaType.id },
        { name: 'Video', mediaTypeId: digitalMediaType.id },
      ];

      for (const subtype of digitalSubtypes) {
        await prisma.mediaSubType.upsert({
          where: { name: subtype.name },
          update: {},
          create: subtype,
        });
      }
    }

    console.log('Created media subtypes');

    // Create PM types
    const pmTypes = [
      { name: 'Brand Manager' },
      { name: 'Product Manager' },
      { name: 'Category Manager' },
    ];

    for (const pmType of pmTypes) {
      await prisma.pMType.upsert({
        where: { name: pmType.name },
        update: {},
        create: pmType,
      });
    }

    console.log('Created PM types');

    console.log('✅ Basic data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding basic data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});