#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Remove test SOV data
    const deletedSOV = await prisma.shareOfVoice.deleteMany({
      where: {
        OR: [
          { uploadedBy: 'test-script' },
          { uploadedBy: 'test-script-update' },
          { uploadedBy: 'test-script-digital' },
          { uploadSession: { contains: 'test-' } }
        ]
      }
    });
    console.log('✅ Deleted', deletedSOV.count, 'test SOV records');

    // Remove test category-range relationships first
    await prisma.categoryToRange.deleteMany({
      where: {
        OR: [
          {
            category: {
              name: 'Test Category SOV'
            }
          },
          {
            range: {
              name: 'Test Range SOV'
            }
          }
        ]
      }
    });

    // Remove test categories
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        name: 'Test Category SOV'
      }
    });
    console.log('✅ Deleted', deletedCategories.count, 'test categories');

    // Remove test ranges
    const deletedRanges = await prisma.range.deleteMany({
      where: {
        name: 'Test Range SOV'
      }
    });
    console.log('✅ Deleted', deletedRanges.count, 'test ranges');

    // Remove test business units
    const deletedBU = await prisma.businessUnit.deleteMany({
      where: {
        name: 'Test BU SOV'
      }
    });
    console.log('✅ Deleted', deletedBU.count, 'test business units');

    // Remove test countries
    const deletedCountries = await prisma.country.deleteMany({
      where: {
        name: 'Test Country SOV'
      }
    });
    console.log('✅ Deleted', deletedCountries.count, 'test countries');

    // Remove test regions
    const deletedRegions = await prisma.region.deleteMany({
      where: {
        name: 'Test Region SOV'
      }
    });
    console.log('✅ Deleted', deletedRegions.count, 'test regions');

    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();