import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Correct understanding: Derma has these 12 RANGES (not category→range mapping)
const dermaRanges = [
  'Acne', 'Anti Pigment', 'Sun', 'Anti Age', 'Aquaphor', 'X-Cat', 
  'Atopi', 'Body Range', 'Hydration', 'pH5', 'Repair', 'Dry Skin',
  'Brand (Institutional)', 'Body Lotion' // from second row
];

// Range → Campaign mapping for Derma (each range has these campaigns)
const rangeToCampaigns: Record<string, string[]> = {
  'Acne': ['Dermopure Body (Bacne)', 'Dermopure RL', 'Dermo Purifyer', 'Gel to Foam', 'Triple Effect', 'Dermopure Cleansing (Activia)', 'Dermopure Cleansing (Yoda)', 'Anti-Acne Range'],
  'Anti Pigment': ['Globe', 'Serum (Avengers)', 'Hidden Spots', 'The Search is Over', 'Thiamidol Roof', 'Booster Serum', 'Boosting Essence', 'Eyes', 'Thiamidol Ramadan', 'Avengers', 'Dragon', 'Power Duo (Avengers + Gel)', 'Anti-Pigment Range', 'AWON Antipigment', 'Eyes (KFP)'],
  'Sun': ['Hydro Fluid Tinted (Bacalar)', 'Sun Range', 'Sun Roof', 'Melanoma + Sun Roof', 'Actinic', 'Sun Oil Control', 'Sun', 'Sun 100', 'Sun-Protection Range', 'Sun', 'Sun Range HS1', 'Sun Range HS2'],
  'Anti Age': ['Elasticity Motown', 'Gold Revamp', '3D Serum', '3D Serum + Dragon'],
  'Aquaphor': ['Aquaphor Club Eucerin', 'Aquaphor'],
  'X-Cat': [], // No campaigns listed
  'Brand (Institutional)': ['Club Eucerin', 'Brand (Institutional)'],
  'Atopi': ['Atopi'],
  'Body Range': ['Search AWON'],
  'Hydration': ['Anti-Redness'],
  'pH5': ['pH5 Wannabe'],
  'Repair': ['Body Roof'],
  'Dry Skin': [], // No campaigns listed in the mapping
  'Body Lotion': ['Body Lotion', 'Urea']
};

async function verifyDermaHierarchyCorrected() {
  try {
    console.log('=== Verifying Derma Ranges and Campaigns ===\n');
    
    // Get all ranges in database
    const allRanges = await prisma.range.findMany({
      include: {
        campaigns: true,
        categories: {
          include: {
            category: {
              include: {
                businessUnit: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total ranges in database: ${allRanges.length}`);
    console.log(`Expected Derma ranges: ${dermaRanges.length}\n`);
    
    // Check which Derma ranges exist
    console.log('=== Derma Range Analysis ===');
    const existingDermaRanges: string[] = [];
    const missingDermaRanges: string[] = [];
    
    dermaRanges.forEach(expectedRange => {
      const dbRange = allRanges.find(r => r.name === expectedRange);
      if (dbRange) {
        existingDermaRanges.push(expectedRange);
        console.log(`✅ ${expectedRange} - EXISTS`);
        
        // Check if it's linked to Derma categories
        const linkedToDerma = dbRange.categories.some(cr => 
          cr.category.businessUnit?.name === 'Derma'
        );
        
        if (!linkedToDerma) {
          console.log(`   ⚠️  Not linked to any Derma category`);
        } else {
          const dermaCategories = dbRange.categories
            .filter(cr => cr.category.businessUnit?.name === 'Derma')
            .map(cr => cr.category.name);
          console.log(`   📋 Linked to Derma categories: ${dermaCategories.join(', ')}`);
        }
        
        // Check campaigns
        const expectedCampaigns = rangeToCampaigns[expectedRange] || [];
        console.log(`   Expected campaigns: ${expectedCampaigns.length}`);
        console.log(`   Current campaigns: ${dbRange.campaigns.length}`);
        
        if (dbRange.campaigns.length > 0) {
          console.log(`   Current: ${dbRange.campaigns.map(c => c.name).join(', ')}`);
        }
        
        if (expectedCampaigns.length > 0) {
          const missingCampaigns = expectedCampaigns.filter((camp: string) => 
            !dbRange.campaigns.some((dbCamp: any) => dbCamp.name === camp)
          );
          if (missingCampaigns.length > 0) {
            console.log(`   ❌ Missing campaigns (${missingCampaigns.length}): ${missingCampaigns.slice(0, 3).join(', ')}${missingCampaigns.length > 3 ? '...' : ''}`);
          }
        }
        
      } else {
        missingDermaRanges.push(expectedRange);
        console.log(`❌ ${expectedRange} - MISSING`);
      }
      console.log('');
    });
    
    // Check for campaigns
    console.log('=== Campaign Analysis ===');
    const totalExpectedCampaigns = Object.values(rangeToCampaigns).flat().length;
    const uniqueExpectedCampaigns = new Set(Object.values(rangeToCampaigns).flat()).size;
    
    console.log(`Total expected campaigns: ${totalExpectedCampaigns}`);
    console.log(`Unique expected campaigns: ${uniqueExpectedCampaigns}`);
    
    const allCampaigns = await prisma.campaign.findMany({
      include: {
        range: true
      }
    });
    
    console.log(`Total campaigns in database: ${allCampaigns.length}`);
    
    // Count campaigns for existing Derma ranges
    let dermaRangeCampaigns = 0;
    existingDermaRanges.forEach(rangeName => {
      const range = allRanges.find(r => r.name === rangeName);
      if (range) {
        dermaRangeCampaigns += range.campaigns.length;
      }
    });
    
    console.log(`Campaigns linked to existing Derma ranges: ${dermaRangeCampaigns}`);
    
    // Summary
    console.log('\n=== Summary ===');
    console.log(`Derma Ranges: ${existingDermaRanges.length}/${dermaRanges.length} exist`);
    console.log(`Missing ranges: ${missingDermaRanges.length}`);
    if (missingDermaRanges.length > 0) {
      console.log(`Missing: ${missingDermaRanges.join(', ')}`);
    }
    console.log(`Expected campaigns: ${uniqueExpectedCampaigns}`);
    console.log(`Current campaigns for Derma ranges: ${dermaRangeCampaigns}`);
    
  } catch (error) {
    console.error('Error verifying hierarchy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDermaHierarchyCorrected();