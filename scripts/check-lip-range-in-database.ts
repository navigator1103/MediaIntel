import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkLipRangeInDatabase() {
  console.log('🔍 CHECKING: Lip range in database vs master data\n');

  try {
    // Load master data
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));
    
    console.log('📊 Master Data Analysis:');
    console.log(`   Total ranges in rangeToCampaigns: ${Object.keys(masterData.rangeToCampaigns || {}).length}`);
    
    // Check if Lip exists in master data
    const lipInMaster = masterData.rangeToCampaigns?.['Lip'];
    console.log(`   Lip in master data: ${lipInMaster ? 'YES' : 'NO'}`);
    if (lipInMaster) {
      console.log(`   Lip campaigns in master: ${lipInMaster.length}`);
      console.log(`   Sample campaigns: ${lipInMaster.slice(0, 3).join(', ')}`);
    }
    
    // Check business unit mapping
    const lipBusinessUnit = masterData.rangeToBusinessUnit?.['Lip'];
    console.log(`   Lip business unit: ${lipBusinessUnit || 'NOT MAPPED'}`);
    
    // Check database
    console.log('\n💾 Database Analysis:');
    
    // Find Lip range
    const lipRanges = await prisma.range.findMany({
      where: { 
        name: { contains: 'Lip', mode: 'insensitive' }
      },
      include: { category: true }
    });
    
    console.log(`   Ranges matching "Lip": ${lipRanges.length}`);
    for (const range of lipRanges) {
      console.log(`   - "${range.name}" (ID: ${range.id}, Status: ${range.status}, Category: ${range.category?.name || 'None'})`);
    }
    
    // Find Lip category
    const lipCategories = await prisma.category.findMany({
      where: { 
        name: { contains: 'Lip', mode: 'insensitive' }
      }
    });
    
    console.log(`   Categories matching "Lip": ${lipCategories.length}`);
    for (const category of lipCategories) {
      console.log(`   - "${category.name}" (ID: ${category.id}, Status: ${category.status})`);
    }
    
    // Check if we have both Lip range and Lip category with same name
    const exactLipRange = await prisma.range.findFirst({
      where: { 
        name: { equals: 'Lip', mode: 'insensitive' },
        status: { not: 'archived' }
      }
    });
    
    const exactLipCategory = await prisma.category.findFirst({
      where: { 
        name: { equals: 'Lip', mode: 'insensitive' },
        status: { not: 'archived' }
      }
    });
    
    console.log(`\n🎯 Exact Match Results:`);
    console.log(`   Exact "Lip" range exists: ${exactLipRange ? 'YES' : 'NO'}`);
    if (exactLipRange) {
      console.log(`      Range ID: ${exactLipRange.id}`);
      console.log(`      Range categoryId: ${exactLipRange.categoryId}`);
    }
    
    console.log(`   Exact "Lip" category exists: ${exactLipCategory ? 'YES' : 'NO'}`);
    if (exactLipCategory) {
      console.log(`      Category ID: ${exactLipCategory.id}`);
    }
    
    // Check if they're linked correctly
    if (exactLipRange && exactLipCategory) {
      console.log(`   Range-Category link correct: ${exactLipRange.categoryId === exactLipCategory.id ? 'YES' : 'NO'}`);
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

checkLipRangeInDatabase().catch(console.error);