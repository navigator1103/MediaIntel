import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Field mapping from validation system
const FIELD_MAPPING = {
  'Category': 'category',
  'Range': 'range',
  'Campaign': 'campaign',
  'TV Demo Gender': 'tvDemoGender',
  'TV Demo Min. Age': 'tvDemoMinAge',
  'TV Demo Max. Age': 'tvDemoMaxAge',
  'TV SEL': 'tvSel',
  'Final TV Target (don\'t fill)': 'finalTvTarget',
  'TV Target Size': 'tvTargetSize',
  'TV Copy Length': 'tvCopyLength',
  'Total TV Planned R1+ (%)': 'tvPlannedR1Plus',
  'Total TV Planned R3+ (%)': 'tvPlannedR3Plus',
  'TV Optimal R1+': 'tvPotentialR1Plus',
  'CPP 2024': 'cpp2024',
  'CPP 2025': 'cpp2025',
  'CPP 2026': 'cpp2026',
  'Reported Currency': 'reportedCurrency',
  'Is Digital target the same than TV?': 'isDigitalTargetSameAsTv',
  'Digital Demo Gender': 'digitalDemoGender',
  'Digital Demo Min. Age': 'digitalDemoMinAge',
  'Digital Demo Max. Age': 'digitalDemoMaxAge',
  'Digital SEL': 'digitalSel',
  'Final Digital Target (don\'t fill)': 'finalDigitalTarget',
  'Digital Target Size (Abs)': 'digitalTargetSizeAbs',
  'Total Digital Planned R1+': 'digitalPlannedR1Plus',
  'Total Digital Optimal R1+': 'digitalPotentialR1Plus',
  'Planned Combined Reach (Don\'t fill)': 'plannedCombinedReach',
  'Combined Potential Reach': 'combinedPotentialReach'
};

// Headers from export API
const EXPORT_HEADERS = [
  'Category', 'Range', 'Campaign',
  'TV Demo Gender', 'TV Demo Min. Age', 'TV Demo Max. Age', 'TV SEL', 
  'Final TV Target (don\'t fill)', 'TV Target Size', 'TV Copy Length',
  'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Optimal R1+',
  'CPP 2024', 'CPP 2025', 'CPP 2026', 'Reported Currency',
  'Is Digital target the same than TV?', 'Digital Demo Gender', 'Digital Demo Min. Age', 
  'Digital Demo Max. Age', 'Digital SEL', 'Final Digital Target (don\'t fill)',
  'Digital Target Size (Abs)', 'Total Digital Planned R1+', 'Total Digital Optimal R1+',
  'Planned Combined Reach (Don\'t fill)', 'Combined Potential Reach'
];

// Digital fields that are required for Digital campaigns
const DIGITAL_FIELDS = [
  'Is Digital target the same than TV?',
  'Digital Target Size (Abs)',
  'Total Digital Planned R1+',
  'Total Digital Optimal R1+'
];

async function testReachPlanningValidation() {
  console.log('🧪 COMPREHENSIVE REACH PLANNING VALIDATION TEST');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Test Export Headers vs Validation Field Mapping
    console.log('\n📋 Step 1: Comparing Export Headers with Validation Field Mapping');
    console.log('-'.repeat(50));
    
    let headerMismatches = 0;
    EXPORT_HEADERS.forEach(header => {
      if (FIELD_MAPPING.hasOwnProperty(header)) {
        console.log(`✅ "${header}" - MATCHES`);
      } else {
        console.log(`❌ "${header}" - NOT FOUND in field mapping`);
        headerMismatches++;
      }
    });
    
    console.log(`\n📊 Header Analysis: ${headerMismatches} mismatches out of ${EXPORT_HEADERS.length} headers`);
    
    // Step 2: Check for missing headers in export that exist in field mapping
    console.log('\n🔍 Step 2: Checking for Missing Headers in Export');
    console.log('-'.repeat(50));
    
    let missingInExport = 0;
    Object.keys(FIELD_MAPPING).forEach(mappingKey => {
      if (!EXPORT_HEADERS.includes(mappingKey)) {
        console.log(`⚠️  "${mappingKey}" - EXISTS in field mapping but MISSING from export headers`);
        missingInExport++;
      }
    });
    
    if (missingInExport === 0) {
      console.log('✅ All field mapping keys are present in export headers');
    }
    
    // Step 3: Test CSV File Analysis
    const csvPath = '/Users/naveedshah/Downloads/ABP2026_Game_Plans_Template-file_copy for testing_Singapore_Sufficiency_Nivea 1 (1).csv';
    
    if (fs.existsSync(csvPath)) {
      console.log('\n📄 Step 3: Analyzing CSV File');
      console.log('-'.repeat(50));
      
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`📊 Parsed ${records.length} records from CSV`);
      
      if (records.length > 0) {
        const csvHeaders = Object.keys(records[0]);
        console.log(`📋 CSV has ${csvHeaders.length} columns`);
        
        console.log('\n🔍 CSV Headers vs Expected Headers:');
        csvHeaders.forEach((csvHeader, index) => {
          if (FIELD_MAPPING.hasOwnProperty(csvHeader)) {
            console.log(`  ${index + 1}. ✅ "${csvHeader}" - VALID`);
          } else {
            console.log(`  ${index + 1}. ❌ "${csvHeader}" - NOT RECOGNIZED`);
            
            // Find closest match
            const closest = Object.keys(FIELD_MAPPING).find(key => 
              key.toLowerCase().replace(/[^a-z0-9]/g, '') === 
              csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (closest) {
              console.log(`      💡 Closest match: "${closest}"`);
              console.log(`      🔍 Difference: CSV="${csvHeader}" vs Expected="${closest}"`);
            }
          }
        });
        
        // Step 4: Test specific Digital field validation for "Hijab Fresh"
        console.log('\n🎯 Step 4: Testing Digital Field Validation for "Hijab Fresh"');
        console.log('-'.repeat(50));
        
        const hijabRow = records.find((record: any) => 
          record.Campaign === 'Hijab Fresh' || 
          Object.values(record).includes('Hijab Fresh')
        );
        
        if (hijabRow) {
          console.log('✅ Found "Hijab Fresh" row in CSV');
          console.log('\n📝 Digital Field Values:');
          
          DIGITAL_FIELDS.forEach(field => {
            const value = hijabRow[field];
            const hasValue = value && value.toString().trim() !== '';
            console.log(`  "${field}": "${value}" ${hasValue ? '✅ HAS VALUE' : '❌ EMPTY/MISSING'}`);
          });
          
          // Check all fields in the row
          console.log('\n📋 All Field Values in Hijab Fresh Row:');
          Object.entries(hijabRow).forEach(([key, value]) => {
            const hasValue = value && value.toString().trim() !== '';
            console.log(`  "${key}": "${value}" ${hasValue ? '✅' : '❌'}`);
          });
          
        } else {
          console.log('❌ Could not find "Hijab Fresh" row in CSV');
          console.log('Available campaigns:', records.map((r: any) => r.Campaign || 'NO_CAMPAIGN'));
        }
        
        // Step 5: Test Game Plans Data
        console.log('\n🎮 Step 5: Testing Game Plans Data');
        console.log('-'.repeat(50));
        
        const singapore = await prisma.country.findFirst({
          where: { name: { contains: 'Singapore' } }
        });
        
        const nivea = await prisma.businessUnit.findFirst({
          where: { name: { contains: 'Nivea' } }
        });
        
        if (singapore && nivea) {
          const hijabGamePlan = await prisma.gamePlan.findFirst({
            where: {
              countryId: singapore.id,
              business_unit_id: nivea.id,
              campaign: {
                name: 'Hijab Fresh'
              }
            },
            include: {
              campaign: true,
              mediaSubType: {
                include: { mediaType: true }
              }
            }
          });
          
          if (hijabGamePlan) {
            console.log('✅ Found "Hijab Fresh" game plan');
            console.log(`📊 Media Type: ${hijabGamePlan.mediaSubType?.mediaType?.name}`);
            console.log(`📊 Media SubType: ${hijabGamePlan.mediaSubType?.name}`);
            console.log(`📊 Campaign: ${hijabGamePlan.campaign?.name}`);
            
            const isDigitalOnly = hijabGamePlan.mediaSubType?.mediaType?.name === 'Digital';
            console.log(`🎯 Is Digital Only: ${isDigitalOnly ? 'YES' : 'NO'}`);
            
            if (isDigitalOnly) {
              console.log('✅ Validation should require Digital fields for this campaign');
            }
          } else {
            console.log('❌ Could not find "Hijab Fresh" game plan');
          }
        }
        
      }
    } else {
      console.log(`❌ CSV file not found at: ${csvPath}`);
    }
    
    // Step 6: Summary and Recommendations
    console.log('\n📋 Step 6: Summary and Recommendations');
    console.log('='.repeat(60));
    
    if (headerMismatches > 0) {
      console.log('🚨 CRITICAL: Header mismatches found between export and validation');
      console.log('   → This will cause validation to not recognize field values');
      console.log('   → Fix: Ensure export headers exactly match validation field mapping');
    }
    
    if (missingInExport > 0) {
      console.log('⚠️  WARNING: Some validation fields are missing from export headers');
      console.log('   → This might cause incomplete template generation');
    }
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testReachPlanningValidation();