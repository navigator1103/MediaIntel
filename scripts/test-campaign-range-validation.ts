import { PrismaClient } from '@prisma/client';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

const prisma = new PrismaClient();

async function testCampaignRangeValidation() {
  try {
    console.log('🧪 Testing campaign-range relationship validation...');

    // Fetch master data similar to how the enhanced validate API does it
    const [campaigns, ranges] = await Promise.all([
      prisma.campaign.findMany({
        include: {
          range: true
        }
      }),
      prisma.range.findMany()
    ]);

    const masterData = {
      campaigns,
      ranges: ranges.map(r => r.name),
      countries: [],
      categories: [],
      mediaTypes: [],
      mediaSubTypes: [],
      businessUnits: [],
      pmTypes: []
    };

    // Create validator with master data
    const validator = new MediaSufficiencyValidator(masterData);

    // Test case 1: Derma Control campaign with Derma Control range (should be WARNING because it's linked to Clinical)
    const testRecord1 = {
      Campaign: 'Derma Control',
      Range: 'Derma Control',
      Country: 'United States',
      Category: 'Face Care',
      Media: 'Digital',
      'Media Subtype': 'Social Media'
    };

    console.log('\\n📝 Test 1: Derma Control campaign with Derma Control range');
    console.log('Expected: Should show warning because Derma Control campaign is actually linked to Clinical range');
    
    const issues1 = await validator.validateRecord(testRecord1, 0, [testRecord1]);
    const campaignIssues1 = issues1.filter(issue => issue.columnName === 'Campaign');
    
    if (campaignIssues1.length > 0) {
      console.log('✅ PASS: Validation detected campaign-range mismatch');
      campaignIssues1.forEach(issue => {
        console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    } else {
      console.log('❌ FAIL: No validation issues detected for campaign-range mismatch');
    }

    // Test case 2: Derma Control campaign with Clinical range (should be VALID)
    const testRecord2 = {
      Campaign: 'Derma Control',
      Range: 'Clinical',
      Country: 'United States', 
      Category: 'Face Care',
      Media: 'Digital',
      'Media Subtype': 'Social Media'
    };

    console.log('\\n📝 Test 2: Derma Control campaign with Clinical range');
    console.log('Expected: Should be valid because Derma Control is actually linked to Clinical');
    
    const issues2 = await validator.validateRecord(testRecord2, 0, [testRecord2]);
    const campaignIssues2 = issues2.filter(issue => issue.columnName === 'Campaign');
    
    if (campaignIssues2.length === 0) {
      console.log('✅ PASS: No validation issues for correct campaign-range mapping');
    } else {
      console.log('❌ FAIL: Unexpected validation issues detected');
      campaignIssues2.forEach(issue => {
        console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    }

    // Test case 3: Non-existent campaign (should pass validation - this rule only checks existing campaigns)
    const testRecord3 = {
      Campaign: 'Non-Existent Campaign',
      Range: 'Some Range',
      Country: 'United States',
      Category: 'Face Care', 
      Media: 'Digital',
      'Media Subtype': 'Social Media'
    };

    console.log('\\n📝 Test 3: Non-existent campaign');
    console.log('Expected: Should pass because this validation rule only checks existing campaigns');
    
    const issues3 = await validator.validateRecord(testRecord3, 0, [testRecord3]);
    const campaignRangeIssues3 = issues3.filter(issue => 
      issue.columnName === 'Campaign' && 
      issue.message.includes('linked to a different range')
    );
    
    if (campaignRangeIssues3.length === 0) {
      console.log('✅ PASS: No campaign-range validation issues for non-existent campaign');
    } else {
      console.log('❌ FAIL: Unexpected campaign-range validation issues for non-existent campaign');
      campaignRangeIssues3.forEach(issue => {
        console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    }

    console.log('\\n✅ Campaign-range validation testing completed!');

  } catch (error) {
    console.error('❌ Error testing campaign-range validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCampaignRangeValidation();