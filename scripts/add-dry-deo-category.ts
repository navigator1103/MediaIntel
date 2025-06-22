import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDryDeoCategory() {
  try {
    console.log('🔄 Adding Dry Deo category and mappings...');

    // 1. Create Dry Deo category
    let dryDeoCategory;
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { name: 'Dry Deo' }
      });
      
      if (existingCategory) {
        console.log(`ℹ️  Category 'Dry Deo' already exists (ID: ${existingCategory.id})`);
        dryDeoCategory = existingCategory;
      } else {
        dryDeoCategory = await prisma.category.create({
          data: { name: 'Dry Deo' }
        });
        console.log(`✅ Created category 'Dry Deo' (ID: ${dryDeoCategory.id})`);
      }
    } catch (error) {
      console.log(`❌ Error creating Dry Deo category: ${error}`);
      return;
    }

    // 2. Set up category-range mappings for Dry Deo
    // Dry Deo category should include deo-related ranges, especially Dry Deo range
    const dryDeoRanges = [
      'Dry Deo',     // Primary range
      'Deep',        // Deep deodorants
      'Clinical',    // Clinical deodorants  
      'Derma Control' // Derma deodorants
    ];

    // Get all ranges
    const allRanges = await prisma.range.findMany();
    const rangeMap = new Map(allRanges.map(r => [r.name, r.id]));

    for (const rangeName of dryDeoRanges) {
      const rangeId = rangeMap.get(rangeName);
      
      if (!rangeId) {
        console.log(`⚠️  Range '${rangeName}' not found`);
        continue;
      }

      try {
        // Check if mapping already exists
        const existingMapping = await prisma.categoryToRange.findUnique({
          where: {
            categoryId_rangeId: {
              categoryId: dryDeoCategory.id,
              rangeId: rangeId
            }
          }
        });

        if (!existingMapping) {
          await prisma.categoryToRange.create({
            data: {
              categoryId: dryDeoCategory.id,
              rangeId: rangeId
            }
          });
          console.log(`✅ Added mapping: Dry Deo → ${rangeName}`);
        } else {
          console.log(`ℹ️  Mapping already exists: Dry Deo → ${rangeName}`);
        }
      } catch (error) {
        console.log(`❌ Error creating mapping Dry Deo → ${rangeName}: ${error}`);
      }
    }

    // 3. Verify Lip category (should already be working)
    const lipCategory = await prisma.category.findUnique({
      where: { name: 'Lip' },
      include: {
        ranges: {
          include: { range: true }
        }
      }
    });

    console.log('\n🔍 Verifying categories:');
    
    if (lipCategory) {
      const lipRanges = lipCategory.ranges.map(r => r.range.name);
      console.log(`✅ Lip category → [${lipRanges.join(', ')}]`);
    } else {
      console.log('⚠️  Lip category not found');
    }

    // Verify new Dry Deo category
    const updatedDryDeoCategory = await prisma.category.findUnique({
      where: { name: 'Dry Deo' },
      include: {
        ranges: {
          include: { range: true }
        }
      }
    });

    if (updatedDryDeoCategory) {
      const dryDeoRangeNames = updatedDryDeoCategory.ranges.map(r => r.range.name);
      console.log(`✅ Dry Deo category → [${dryDeoRangeNames.join(', ')}]`);
    }

    // 4. Check what campaigns exist for these ranges
    console.log('\n📊 Checking campaigns for key ranges:');
    
    const dryDeoRange = await prisma.range.findUnique({
      where: { name: 'Dry Deo' },
      include: { campaigns: true }
    });

    if (dryDeoRange) {
      const campaignNames = dryDeoRange.campaigns.map(c => c.name);
      console.log(`Dry Deo range campaigns: [${campaignNames.join(', ')}]`);
    }

    const lipRange = await prisma.range.findUnique({
      where: { name: 'Lip' },
      include: { campaigns: true }
    });

    if (lipRange) {
      const campaignNames = lipRange.campaigns.map(c => c.name);
      console.log(`Lip range campaigns: [${campaignNames.join(', ')}]`);
    }

    console.log('\n🎯 Dry Deo category setup complete!');

  } catch (error) {
    console.error('❌ Error setting up Dry Deo category:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDryDeoCategory();