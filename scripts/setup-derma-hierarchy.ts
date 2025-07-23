import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Complete Derma range → campaign mapping
const dermaRangeCampaigns: Record<string, string[]> = {
  'Acne': ['Dermopure Body (Bacne)', 'Dermopure RL', 'Dermo Purifyer', 'Gel to Foam', 'Triple Effect', 'Dermopure Cleansing (Activia)', 'Dermopure Cleansing (Yoda)', 'Anti-Acne Range'],
  'Anti Pigment': ['Globe', 'Serum (Avengers)', 'Hidden Spots', 'The Search is Over', 'Thiamidol Roof', 'Booster Serum', 'Boosting Essence', 'Eyes', 'Thiamidol Ramadan', 'Avengers', 'Dragon', 'Power Duo (Avengers + Gel)', 'Anti-Pigment Range', 'AWON Antipigment', 'Eyes (KFP)'],
  'Sun': ['Hydro Fluid Tinted (Bacalar)', 'Sun Range', 'Sun Roof', 'Melanoma + Sun Roof', 'Actinic', 'Sun Oil Control', 'Sun', 'Sun 100', 'Sun-Protection Range', 'Sun Range HS1', 'Sun Range HS2'],
  'Anti Age': ['Elasticity Motown', 'Gold Revamp', '3D Serum', '3D Serum + Dragon'],
  'Aquaphor': ['Aquaphor Club Eucerin', 'Aquaphor'],
  'X-Cat': [], // No campaigns specified
  'Brand (Institutional)': ['Club Eucerin', 'Brand (Institutional)'],
  'Atopi': ['Atopi'],
  'Body Range': ['Search AWON'],
  'Hydration': ['Anti-Redness'],
  'pH5': ['pH5 Wannabe'],
  'Repair': ['Body Roof'],
  'Dry Skin': [], // No campaigns specified
  'Body Lotion': ['Body Lotion', 'Urea']
};

async function setupDermaHierarchy() {
  try {
    console.log('=== Setting Up Complete Derma Hierarchy ===\n');
    
    // Get Derma business unit
    const dermaBusinessUnit = await prisma.businessUnit.findFirst({
      where: { name: 'Derma' }
    });
    
    if (!dermaBusinessUnit) {
      console.error('Derma business unit not found!');
      return;
    }
    
    console.log(`Found Derma business unit (ID: ${dermaBusinessUnit.id})\n`);
    
    // Step 1: Create missing X-Cat range
    console.log('=== Step 1: Creating Missing X-Cat Range ===');
    const existingXCat = await prisma.range.findFirst({
      where: { name: 'X-Cat' }
    });
    
    if (!existingXCat) {
      const xCatRange = await prisma.range.create({
        data: {
          name: 'X-Cat',
          status: 'active'
        }
      });
      console.log(`✅ Created X-Cat range (ID: ${xCatRange.id})`);
    } else {
      console.log(`✅ X-Cat range already exists (ID: ${existingXCat.id})`);
    }
    
    // Step 2: Get all Derma categories
    console.log('\n=== Step 2: Getting Derma Categories ===');
    const dermaCategories = await prisma.category.findMany({
      where: { businessUnitId: dermaBusinessUnit.id }
    });
    
    console.log(`Found ${dermaCategories.length} Derma categories:`);
    dermaCategories.forEach(cat => console.log(`- ${cat.name} (ID: ${cat.id})`));
    
    // Check for missing categories and handle them
    const expectedCategoryNames = ['Acne', 'Anti Pigment', 'Sun', 'Anti Age', 'Aquaphor', 'X-Cat', 'Atopi', 'Body Range', 'Hydration', 'pH5', 'Repair', 'Dry Skin', 'Body Lotion'];
    
    for (const categoryName of expectedCategoryNames) {
      const existingCategory = dermaCategories.find(cat => cat.name === categoryName);
      if (!existingCategory) {
        // Check if category exists but not linked to Derma
        const globalCategory = await prisma.category.findFirst({
          where: { name: categoryName }
        });
        
        if (globalCategory) {
          // Update existing category to link to Derma
          const updatedCategory = await prisma.category.update({
            where: { id: globalCategory.id },
            data: { businessUnitId: dermaBusinessUnit.id }
          });
          console.log(`✅ Linked existing category to Derma: ${categoryName} (ID: ${updatedCategory.id})`);
          dermaCategories.push(updatedCategory);
        } else {
          // Create new category
          const newCategory = await prisma.category.create({
            data: {
              name: categoryName,
              businessUnitId: dermaBusinessUnit.id
            }
          });
          console.log(`✅ Created missing category: ${categoryName} (ID: ${newCategory.id})`);
          dermaCategories.push(newCategory);
        }
      }
    }
    
    // Step 3: Link ranges to categories
    console.log('\n=== Step 3: Linking Ranges to Categories ===');
    let linksCreated = 0;
    
    for (const rangeName of Object.keys(dermaRangeCampaigns)) {
      // Find the range
      const range = await prisma.range.findFirst({
        where: { name: rangeName }
      });
      
      if (!range) {
        console.log(`⚠️  Range not found: ${rangeName}`);
        continue;
      }
      
      // Find matching category (should have same name as range for Derma)
      const category = dermaCategories.find(cat => cat.name === rangeName);
      
      if (!category) {
        console.log(`⚠️  Category not found for range: ${rangeName}`);
        continue;
      }
      
      // Check if link already exists
      const existingLink = await prisma.categoryToRange.findFirst({
        where: {
          categoryId: category.id,
          rangeId: range.id
        }
      });
      
      if (!existingLink) {
        await prisma.categoryToRange.create({
          data: {
            categoryId: category.id,
            rangeId: range.id
          }
        });
        console.log(`✅ Linked ${category.name} category to ${range.name} range`);
        linksCreated++;
      } else {
        console.log(`✅ ${category.name} ↔ ${range.name} already linked`);
      }
    }
    
    console.log(`\nCreated ${linksCreated} new category-range links`);
    
    // Step 4: Create missing campaigns
    console.log('\n=== Step 4: Creating Missing Campaigns ===');
    let campaignsCreated = 0;
    
    for (const [rangeName, campaignNames] of Object.entries(dermaRangeCampaigns)) {
      if (campaignNames.length === 0) {
        console.log(`📝 ${rangeName}: No campaigns to create`);
        continue;
      }
      
      // Find the range
      const range = await prisma.range.findFirst({
        where: { name: rangeName },
        include: { campaigns: true }
      });
      
      if (!range) {
        console.log(`⚠️  Range not found: ${rangeName}`);
        continue;
      }
      
      console.log(`\n📋 Processing ${rangeName} range (${campaignNames.length} expected campaigns):`);
      
      for (const campaignName of campaignNames) {
        // Check if campaign already exists
        const existingCampaign = await prisma.campaign.findFirst({
          where: { name: campaignName }
        });
        
        if (!existingCampaign) {
          const newCampaign = await prisma.campaign.create({
            data: {
              name: campaignName,
              rangeId: range.id,
              status: 'active'
            }
          });
          console.log(`   ✅ Created: ${campaignName} (ID: ${newCampaign.id})`);
          campaignsCreated++;
        } else {
          // Check if it's linked to the correct range
          if (existingCampaign.rangeId !== range.id) {
            await prisma.campaign.update({
              where: { id: existingCampaign.id },
              data: { rangeId: range.id }
            });
            console.log(`   🔄 Updated: ${campaignName} → linked to ${rangeName}`);
          } else {
            console.log(`   ✅ Exists: ${campaignName}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Created ${campaignsCreated} new campaigns`);
    
    // Step 5: Verification
    console.log('\n=== Step 5: Final Verification ===');
    
    const finalVerification = await prisma.businessUnit.findFirst({
      where: { name: 'Derma' },
      include: {
        categories: {
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
          }
        }
      }
    });
    
    if (finalVerification) {
      console.log(`\n📊 Final Derma Hierarchy Summary:`);
      console.log(`Categories: ${finalVerification.categories.length}`);
      
      let totalRanges = 0;
      let totalCampaigns = 0;
      
      finalVerification.categories.forEach(category => {
        const rangeCount = category.ranges.length;
        const campaignCount = category.ranges.reduce((sum, cr) => sum + cr.range.campaigns.length, 0);
        
        totalRanges += rangeCount;
        totalCampaigns += campaignCount;
        
        console.log(`  ${category.name}: ${rangeCount} range(s), ${campaignCount} campaign(s)`);
      });
      
      console.log(`\nTotal: ${totalRanges} ranges, ${totalCampaigns} campaigns`);
      console.log(`Expected: ${Object.keys(dermaRangeCampaigns).length} ranges, ${Object.values(dermaRangeCampaigns).flat().length} campaigns`);
    }
    
    console.log('\n✅ Derma hierarchy setup complete!');
    
  } catch (error) {
    console.error('Error setting up Derma hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDermaHierarchy();