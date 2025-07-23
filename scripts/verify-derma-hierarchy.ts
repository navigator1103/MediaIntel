import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Expected Category → Range mapping for Derma
const expectedCategoryToRange = {
  'Acne': ['Dermopure Body (Bacne)', 'Dermopure RL', 'Dermo Purifyer', 'Gel to Foam', 'Triple Effect', 'Dermopure Cleansing (Activia)', 'Dermopure Cleansing (Yoda)', 'Anti-Acne Range'],
  'Anti Pigment': ['Globe', 'Serum (Avengers)', 'Hidden Spots', 'The Search is Over', 'Thiamidol Roof', 'Booster Serum', 'Boosting Essence', 'Eyes', 'Thiamidol Ramadan', 'Avengers', 'Dragon', 'Power Duo (Avengers + Gel)', 'Anti-Pigment Range', 'AWON Antipigment', 'Eyes (KFP)'],
  'Sun': ['Hydro Fluid Tinted (Bacalar)', 'Sun Range', 'Sun Roof', 'Melanoma + Sun Roof', 'Actinic', 'Sun Oil Control', 'Sun', 'Sun 100', 'Sun-Protection Range', 'Sun', 'Sun Range HS1', 'Sun Range HS2'],
  'Anti Age': ['Elasticity Motown', 'Gold Revamp', '3D Serum', '3D Serum + Dragon'],
  'Aquaphor': ['Aquaphor Club Eucerin', 'Aquaphor'],
  'Brand (Institutional)': ['Club Eucerin', 'Brand (Institutional)'],
  'Atopi': ['Atopi'],
  'Body Range': ['Search AWON'],
  'Hydration': ['Anti-Redness'],
  'pH5': ['pH5 Wannabe'],
  'Repair': ['Body Roof'],
  'Body Lotion': ['Body Lotion', 'Urea']
};

// Expected Range → Campaign mapping for Derma
const expectedRangeToCampaign = {
  'Dermopure Body (Bacne)': [],
  'Globe': [],
  'Hydro Fluid Tinted (Bacalar)': [],
  'Elasticity Motown': [],
  'Aquaphor Club Eucerin': [],
  'Club Eucerin': [],
  'Atopi': [],
  'Search AWON': [],
  'Anti-Redness': [],
  'pH5 Wannabe': [],
  'Body Roof': [],
  'Body Lotion': [],
  'Dermopure RL': [],
  'Serum (Avengers)': [],
  'Sun Range': [],
  'Gold Revamp': [],
  'Aquaphor': [],
  'Brand (Institutional)': [],
  'Urea': [],
  'Dermo Purifyer': [],
  'Hidden Spots': [],
  'Sun Roof': [],
  '3D Serum': [],
  'Yo voy al derm': [],
  'Customers AWON': [],
  'Gel to Foam': [],
  'The Search is Over': [],
  'Melanoma + Sun Roof': [],
  '3D Serum + Dragon': [],
  'Lead Capturing AWON': [],
  'Triple Effect': [],
  'Thiamidol Roof': [],
  'Actinic': [],
  'Eucerin brand AWON': [],
  'Dermopure Cleansing (Activia)': [],
  'Booster Serum': [],
  'Sun Oil Control': [],
  'Dermopure Cleansing (Yoda)': [],
  'Boosting Essence': [],
  'Sun': [],
  'Anti-Acne Range': [],
  'Eyes': [],
  'Sun 100': [],
  'Thiamidol Ramadan': [],
  'Sun-Protection Range': [],
  'Avengers': [],
  'Sun Range HS1': [],
  'Dragon': [],
  'Sun Range HS2': [],
  'Power Duo (Avengers + Gel)': [],
  'Anti-Pigment Range': [],
  'AWON Antipigment': [],
  'Eyes (KFP)': []
};

async function verifyDermaHierarchy() {
  try {
    console.log('=== Verifying Derma Category → Range → Campaign Hierarchy ===\n');
    
    // Get Derma business unit
    const dermaBusinessUnit = await prisma.businessUnit.findFirst({
      where: { name: 'Derma' }
    });
    
    if (!dermaBusinessUnit) {
      console.error('Derma business unit not found!');
      return;
    }
    
    console.log(`Found Derma business unit (ID: ${dermaBusinessUnit.id})\n`);
    
    // Get all current categories for Derma
    const dermaCategories = await prisma.category.findMany({
      where: { businessUnitId: dermaBusinessUnit.id },
      include: {
        ranges: {
          include: {
            range: {
              include: {
                campaigns: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Current Derma categories in database: ${dermaCategories.length}\n`);
    
    // Check each expected category
    const allExpectedRanges = new Set<string>();
    Object.values(expectedCategoryToRange).flat().forEach(range => allExpectedRanges.add(range));
    
    console.log('=== Category Analysis ===');
    for (const [expectedCategory, expectedRanges] of Object.entries(expectedCategoryToRange)) {
      const dbCategory = dermaCategories.find(cat => cat.name === expectedCategory);
      
      if (!dbCategory) {
        console.log(`❌ MISSING CATEGORY: "${expectedCategory}"`);
        continue;
      }
      
      console.log(`\n📋 ${expectedCategory} (✅ exists in DB)`);
      console.log(`   Expected ranges: ${expectedRanges.length}`);
      
      const currentRanges = dbCategory.ranges.map(cr => cr.range.name);
      console.log(`   Current ranges: ${currentRanges.length}`);
      
      if (currentRanges.length > 0) {
        console.log(`   Current: ${currentRanges.join(', ')}`);
      }
      
      // Find missing ranges
      const missingRanges = expectedRanges.filter(range => !currentRanges.includes(range));
      if (missingRanges.length > 0) {
        console.log(`   ❌ Missing ranges (${missingRanges.length}): ${missingRanges.join(', ')}`);
      }
      
      // Find extra ranges
      const extraRanges = currentRanges.filter(range => !expectedRanges.includes(range));
      if (extraRanges.length > 0) {
        console.log(`   ⚠️  Extra ranges (${extraRanges.length}): ${extraRanges.join(', ')}`);
      }
    }
    
    // Check all ranges in database
    console.log('\n\n=== Range Analysis ===');
    const allRanges = await prisma.range.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        campaigns: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total ranges in database: ${allRanges.length}`);
    console.log(`Expected ranges for Derma: ${allExpectedRanges.size}`);
    
    const missingRanges = Array.from(allExpectedRanges).filter(expectedRange => 
      !allRanges.some(dbRange => dbRange.name === expectedRange)
    );
    
    if (missingRanges.length > 0) {
      console.log(`\n❌ Missing ranges in database (${missingRanges.length}):`);
      missingRanges.forEach((range, index) => {
        console.log(`   ${index + 1}. ${range}`);
      });
    }
    
    // Check campaigns
    console.log('\n\n=== Campaign Analysis ===');
    const totalCampaigns = await prisma.campaign.count();
    console.log(`Total campaigns in database: ${totalCampaigns}`);
    
    const rangesWithCampaigns = allRanges.filter(range => range.campaigns.length > 0);
    console.log(`Ranges with campaigns: ${rangesWithCampaigns.length}/${allRanges.length}`);
    
    if (rangesWithCampaigns.length > 0) {
      console.log('\nRanges that have campaigns:');
      rangesWithCampaigns.forEach(range => {
        console.log(`   - ${range.name}: ${range.campaigns.length} campaigns`);
      });
    }
    
    // Summary
    console.log('\n=== Summary ===');
    const existingCategories = Object.keys(expectedCategoryToRange).filter(cat => 
      dermaCategories.some(dbCat => dbCat.name === cat)
    );
    
    console.log(`Categories: ${existingCategories.length}/${Object.keys(expectedCategoryToRange).length} exist`);
    console.log(`Ranges: ${allRanges.length - missingRanges.length}/${allExpectedRanges.size} exist`);
    console.log(`Missing ranges: ${missingRanges.length}`);
    
  } catch (error) {
    console.error('Error verifying hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDermaHierarchy();