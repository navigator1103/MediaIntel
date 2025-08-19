import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import the validation function (simplified version for testing)
const SHARED_CAMPAIGNS = [
  'Search AWON',
  'Luminous Launch India',
  'Orionis',
  'Lucia', 
  'Sirena',
  '50 Shades',
  'Stardust',
  'Stargate',
  'Midnight Gold',
  'Polaris',
  'Sirius'
];

async function validateCampaignCategory(campaignInput: string, categoryInput: string, masterData: any) {
  const isSharedCampaign = SHARED_CAMPAIGNS.some(sharedCampaign => 
    sharedCampaign.toLowerCase() === campaignInput.toLowerCase()
  );

  if (isSharedCampaign) {
    // Use many-to-many validation for shared campaigns
    const campaignToRangeMap = masterData.campaignToRangeMap || {};
    const validRanges = campaignToRangeMap[campaignInput] || [];
    
    // Check if any of the valid ranges belong to this category
    for (const rangeName of validRanges) {
      const rangeToCategoriesMap = masterData.rangeToCategoriesMap || {};
      const rangeCategories = rangeToCategoriesMap[rangeName] || [];
      if (rangeCategories.includes(categoryInput)) {
        return { isValid: true, message: '' };
      }
    }
    
    return {
      isValid: false,
      message: `Campaign "${campaignInput}" is not available in category "${categoryInput}". Valid categories: [${validRanges.map((r: string) => masterData.rangeToCategoriesMap[r] || []).flat().join(', ')}]`
    };
  } else {
    // Use regular validation for non-shared campaigns
    const categoryToCampaignsMap = masterData.categoryToCampaignsMap || {};
    const categoryRanges = categoryToCampaignsMap[categoryInput] || [];
    
    if (categoryRanges.includes(campaignInput)) {
      return { isValid: true, message: '' };
    } else {
      return {
        isValid: false,
        message: `Campaign "${campaignInput}" is not available in category "${categoryInput}"`
      };
    }
  }
}

async function validateCampaignRange(campaignInput: string, rangeInput: string, masterData: any) {
  const isSharedCampaign = SHARED_CAMPAIGNS.some(sharedCampaign => 
    sharedCampaign.toLowerCase() === campaignInput.toLowerCase()
  );

  if (isSharedCampaign) {
    // Use many-to-many validation for shared campaigns
    const campaignToRangeMap = masterData.campaignToRangeMap || {};
    const validRanges = campaignToRangeMap[campaignInput] || [];
    
    if (validRanges.includes(rangeInput)) {
      return { isValid: true, message: '' };
    } else {
      return {
        isValid: false,
        message: `Campaign "${campaignInput}" is not available in range "${rangeInput}". Valid ranges: [${validRanges.join(', ')}]`
      };
    }
  } else {
    // Use regular validation for non-shared campaigns
    const rangeToCampaignsMap = masterData.rangeToCampaignsMap || {};
    const rangeCampaigns = rangeToCampaignsMap[rangeInput] || [];
    
    if (rangeCampaigns.includes(campaignInput)) {
      return { isValid: true, message: '' };
    } else {
      return {
        isValid: false,
        message: `Campaign "${campaignInput}" is not available in range "${rangeInput}"`
      };
    }
  }
}

async function testFixedValidation() {
  console.log('🧪 Testing validation for fixed campaigns...\n');
  
  // Get master data
  console.log('📊 Loading master data...');
  
  // Build rangeToCampaignsMap from direct campaign.rangeId relationships
  const ranges = await prisma.range.findMany({
    include: {
      campaigns: true
    }
  });
  
  const rangeToCampaignsMap: Record<string, string[]> = {};
  ranges.forEach(range => {
    rangeToCampaignsMap[range.name] = range.campaigns.map(c => c.name);
  });
  
  // Build campaignToRangeMap from junction table  
  const rangeToCampaignJunctions = await prisma.rangeToCampaign.findMany({
    include: {
      range: true,
      campaign: true
    }
  });
  
  const campaignToRangeMap: Record<string, string[]> = {};
  rangeToCampaignJunctions.forEach(junction => {
    if (junction.range && junction.campaign && junction.range.name && junction.campaign.name) {
      const rangeName = junction.range.name;
      const campaignName = junction.campaign.name;
      
      if (!campaignToRangeMap[campaignName]) {
        campaignToRangeMap[campaignName] = [];
      }
      if (!campaignToRangeMap[campaignName].includes(rangeName)) {
        campaignToRangeMap[campaignName].push(rangeName);
      }
    }
  });
  
  const masterData = {
    rangeToCampaignsMap,
    campaignToRangeMap
  };
  
  // Test the problematic campaigns
  const testCases = [
    { campaign: 'Zazil', range: 'Deo Even Tone' },
    { campaign: 'Sachet', range: 'Deo Even Tone' },
    { campaign: 'Deep X-Cat', range: 'Deep' },
    { campaign: 'Vitamin Scrub', range: 'Men' },
    { campaign: 'C&E Tata', range: 'Vitamin Range' },
    { campaign: 'Dermo Purifyer', range: 'Acne' },
    { campaign: 'Brand (Institutional)', range: 'X-Cat' },
    { campaign: 'Eucerin brand AWON', range: 'X-Cat' }
  ];
  
  console.log('🧪 Running validation tests...\n');
  
  for (const { campaign, range } of testCases) {
    console.log(`🔍 Testing: "${campaign}" in range "${range}"`);
    
    const result = await validateCampaignRange(campaign, range, masterData);
    
    if (result.isValid) {
      console.log(`   ✅ PASS: Validation successful`);
    } else {
      console.log(`   ❌ FAIL: ${result.message}`);
    }
  }
  
  console.log('\n✅ Validation testing completed!');
  
  await prisma.$disconnect();
}

testFixedValidation();