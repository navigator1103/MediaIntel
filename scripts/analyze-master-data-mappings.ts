import * as fs from 'fs';
import * as path from 'path';

// Load master data
const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

console.log('=== MASTER DATA MAPPING ANALYSIS ===\n');

// 1. Check for ranges that exist in different mappings
console.log('1. RANGE CONSISTENCY CHECK:');
console.log('---------------------------');

const rangesInList = masterData.ranges || [];
const rangesInRangeToCategories = Object.keys(masterData.rangeToCategories || {});
const rangesInRangeToCampaigns = Object.keys(masterData.rangeToCampaigns || {});
const rangesInRangeToBusinessUnit = Object.keys(masterData.rangeToBusinessUnit || {});

console.log(`Total ranges in main list: ${rangesInList.length}`);
console.log(`Ranges with category mappings: ${rangesInRangeToCategories.length}`);
console.log(`Ranges with campaign mappings: ${rangesInRangeToCampaigns.length}`);
console.log(`Ranges with business unit mappings: ${rangesInRangeToBusinessUnit.length}`);

// Find ranges missing from rangeToCampaigns
const missingFromCampaigns = rangesInRangeToCategories.filter(range => 
  !rangesInRangeToCampaigns.includes(range)
);

console.log(`\nRanges missing from rangeToCampaigns (${missingFromCampaigns.length}):`);
missingFromCampaigns.forEach(range => {
  const categories = masterData.rangeToCategories[range];
  console.log(`  - "${range}" (categories: ${JSON.stringify(categories)})`);
});

// 2. Check for campaigns that reference non-existent ranges
console.log('\n2. CAMPAIGN-RANGE VALIDATION:');
console.log('-----------------------------');

const campaignToRange = masterData.campaignToRange || {};
const campaignRangeIssues: string[] = [];

Object.entries(campaignToRange).forEach(([campaign, range]) => {
  const rangeStr = range as string;
  if (!rangesInList.includes(rangeStr)) {
    campaignRangeIssues.push(`Campaign "${campaign}" references non-existent range "${rangeStr}"`);
  }
});

if (campaignRangeIssues.length > 0) {
  console.log('Campaign-Range inconsistencies:');
  campaignRangeIssues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✓ All campaigns reference valid ranges');
}

// 3. Check bidirectional consistency between rangeToCampaigns and campaignToRange
console.log('\n3. BIDIRECTIONAL MAPPING CONSISTENCY:');
console.log('------------------------------------');

const bidirectionalIssues: string[] = [];

// Check if every campaign in rangeToCampaigns has a corresponding entry in campaignToRange
Object.entries(masterData.rangeToCampaigns || {}).forEach(([range, campaigns]) => {
  (campaigns as string[]).forEach(campaign => {
    if (!campaignToRange[campaign]) {
      bidirectionalIssues.push(`Campaign "${campaign}" in rangeToCampaigns["${range}"] but missing from campaignToRange`);
    } else if (campaignToRange[campaign] !== range) {
      bidirectionalIssues.push(`Campaign "${campaign}" maps to different ranges: rangeToCampaigns["${range}"] vs campaignToRange["${campaignToRange[campaign]}"]`);
    }
  });
});

// Check if every campaign in campaignToRange has a corresponding entry in rangeToCampaigns
Object.entries(campaignToRange).forEach(([campaign, range]) => {
  const rangeStr = range as string;
  const rangeCampaigns = (masterData.rangeToCampaigns as any)[rangeStr] || [];
  if (!rangeCampaigns.includes(campaign)) {
    bidirectionalIssues.push(`Campaign "${campaign}" in campaignToRange["${rangeStr}"] but missing from rangeToCampaigns["${rangeStr}"]`);
  }
});

if (bidirectionalIssues.length > 0) {
  console.log('Bidirectional mapping issues:');
  bidirectionalIssues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✓ All bidirectional mappings are consistent');
}

// 4. Check category-range consistency
console.log('\n4. CATEGORY-RANGE CONSISTENCY:');
console.log('------------------------------');

const categoryToRanges = masterData.categoryToRanges || {};
const rangeToCategories = masterData.rangeToCategories || {};
const categoryRangeIssues: string[] = [];

// Check categoryToRanges vs rangeToCategories consistency
Object.entries(categoryToRanges).forEach(([category, ranges]) => {
  (ranges as string[]).forEach(range => {
    const rangeCategories = rangeToCategories[range] || [];
    if (!rangeCategories.includes(category)) {
      categoryRangeIssues.push(`Category "${category}" includes range "${range}" but range doesn't include category`);
    }
  });
});

// Check rangeToCategories vs categoryToRanges consistency
Object.entries(rangeToCategories).forEach(([range, categories]) => {
  (categories as string[]).forEach(category => {
    const categoryRanges = categoryToRanges[category] || [];
    if (!categoryRanges.includes(range)) {
      categoryRangeIssues.push(`Range "${range}" includes category "${category}" but category doesn't include range`);
    }
  });
});

if (categoryRangeIssues.length > 0) {
  console.log('Category-Range consistency issues:');
  categoryRangeIssues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✓ All category-range mappings are consistent');
}

// 5. Specific analysis for user's issue: Men Deep range
console.log('\n5. SPECIFIC ANALYSIS: "Men Deep" RANGE:');
console.log('--------------------------------------');

const menDeepAnalysis = {
  existsInRangesList: rangesInList.includes('Men Deep'),
  categoriesMapping: rangeToCategories['Men Deep'],
  campaignsMapping: masterData.rangeToCampaigns['Men Deep'],
  businessUnitMapping: masterData.rangeToBusinessUnit['Men Deep']
};

console.log('Men Deep range analysis:');
console.log(`  - Exists in ranges list: ${menDeepAnalysis.existsInRangesList}`);
console.log(`  - Categories: ${JSON.stringify(menDeepAnalysis.categoriesMapping)}`);
console.log(`  - Campaigns: ${JSON.stringify(menDeepAnalysis.campaignsMapping)}`);
console.log(`  - Business Unit: ${menDeepAnalysis.businessUnitMapping}`);

// Check if "Deep" campaign exists and what range it should map to
const deepCampaignAnalysis = {
  existsInCampaignToRange: !!campaignToRange['Deep'],
  mappedToRange: campaignToRange['Deep'],
  foundInRangeToCampaigns: []
};

Object.entries(masterData.rangeToCampaigns || {}).forEach(([range, campaigns]) => {
  const campaignList = campaigns as string[];
  if (campaignList.includes('Deep')) {
    (deepCampaignAnalysis.foundInRangeToCampaigns as string[]).push(range);
  }
});

console.log('\n"Deep" campaign analysis:');
console.log(`  - Exists in campaignToRange: ${deepCampaignAnalysis.existsInCampaignToRange}`);
console.log(`  - Mapped to range: ${deepCampaignAnalysis.mappedToRange}`);
console.log(`  - Found in rangeToCampaigns for ranges: ${JSON.stringify(deepCampaignAnalysis.foundInRangeToCampaigns)}`);

// 6. Generate recommendations
console.log('\n6. RECOMMENDATIONS:');
console.log('------------------');

console.log('\nFor the user\'s specific issue (Category: Deo, Range: Men Deep, Campaign: Deep):');
if (!menDeepAnalysis.campaignsMapping) {
  console.log('  ❌ "Men Deep" range has no campaigns defined in rangeToCampaigns');
  console.log('  💡 Need to add campaign mappings for "Men Deep" range');
} else if (!menDeepAnalysis.campaignsMapping.includes('Deep')) {
  console.log(`  ❌ "Deep" campaign not valid for "Men Deep" range (valid: ${JSON.stringify(menDeepAnalysis.campaignsMapping)})`);
  console.log('  💡 Either add "Deep" to "Men Deep" campaigns OR user should select different range/campaign');
}

if (deepCampaignAnalysis.mappedToRange && deepCampaignAnalysis.mappedToRange !== 'Men Deep') {
  console.log(`  ℹ️  "Deep" campaign is already mapped to "${deepCampaignAnalysis.mappedToRange}" range`);
  const deepRangeCategories = rangeToCategories[deepCampaignAnalysis.mappedToRange];
  console.log(`  ℹ️  "${deepCampaignAnalysis.mappedToRange}" range supports categories: ${JSON.stringify(deepRangeCategories)}`);
}

console.log('\nGeneral recommendations:');
if (missingFromCampaigns.length > 0) {
  console.log(`  - Add campaign mappings for ${missingFromCampaigns.length} ranges missing from rangeToCampaigns`);
}
if (bidirectionalIssues.length > 0) {
  console.log(`  - Fix ${bidirectionalIssues.length} bidirectional mapping inconsistencies`);
}
if (categoryRangeIssues.length > 0) {
  console.log(`  - Fix ${categoryRangeIssues.length} category-range consistency issues`);
}

console.log('\n=== ANALYSIS COMPLETE ===');