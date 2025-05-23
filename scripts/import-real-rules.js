// Script to import real rules from previous application
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Real rules data from the previous application
const realRules = [
  {
    platform: "Meta",
    title: "Proper Account Structure",
    description: "Accounts should be structured according to Meta best practices with proper campaign naming conventions and organization.",
    category: "Account Setup",
    status: "active",
    priority: "high"
  },
  {
    platform: "Meta",
    title: "Conversion Tracking Implementation",
    description: "All Meta campaigns should have proper conversion tracking set up with the Meta pixel and appropriate events.",
    category: "Tracking",
    status: "active",
    priority: "high"
  },
  {
    platform: "Meta",
    title: "Creative Aspect Ratios",
    description: "All Meta ads should use recommended aspect ratios (1:1, 4:5, 9:16) for optimal performance across placements.",
    category: "Creative",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Audience Segmentation",
    description: "Campaigns should use appropriate audience segmentation strategies including lookalikes, interests, and custom audiences.",
    category: "Targeting",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Campaign Budget Optimization",
    description: "CBO should be enabled at the campaign level to optimize budget allocation across ad sets.",
    category: "Optimization",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Conversion Tracking Setup",
    description: "All Google Ads campaigns should have proper conversion tracking implemented with appropriate attribution models.",
    category: "Tracking",
    status: "active",
    priority: "high"
  },
  {
    platform: "Google Ads",
    title: "Campaign Structure",
    description: "Campaigns should follow Google's recommended structure with appropriate use of campaign types and ad groups.",
    category: "Account Setup",
    status: "active",
    priority: "high"
  },
  {
    platform: "Google Ads",
    title: "Keyword Match Types",
    description: "Appropriate keyword match types should be used based on campaign goals, with negative keywords implemented.",
    category: "Keywords",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Ad Extensions Implementation",
    description: "All relevant ad extensions should be implemented including sitelinks, callouts, and structured snippets.",
    category: "Ad Format",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Responsive Search Ads Usage",
    description: "Each ad group should contain at least one responsive search ad with multiple headlines and descriptions.",
    category: "Ad Format",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Pixel Implementation",
    description: "TikTok pixel should be properly implemented with all relevant events for conversion tracking.",
    category: "Tracking",
    status: "active",
    priority: "high"
  },
  {
    platform: "TikTok",
    title: "Creative Format Compliance",
    description: "All TikTok ads should use vertical format (9:16) and follow platform-specific creative best practices.",
    category: "Creative",
    status: "active",
    priority: "high"
  },
  {
    platform: "TikTok",
    title: "Campaign Objective Selection",
    description: "Campaign objectives should be aligned with marketing goals (awareness, consideration, conversion).",
    category: "Strategy",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Audience Targeting Strategy",
    description: "Appropriate audience targeting should be implemented using interests, behaviors, and custom audiences.",
    category: "Targeting",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Automated Creative Optimization",
    description: "ACO should be enabled where appropriate to test multiple creative combinations.",
    category: "Optimization",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Floodlight Configuration",
    description: "Proper floodlight configuration should be implemented for conversion tracking and audience building.",
    category: "Tracking",
    status: "active",
    priority: "high"
  },
  {
    platform: "DV360",
    title: "Campaign Structure",
    description: "Campaigns should be structured according to DV360 best practices with appropriate insertion orders and line items.",
    category: "Account Setup",
    status: "active",
    priority: "high"
  },
  {
    platform: "DV360",
    title: "Frequency Management",
    description: "Appropriate frequency caps should be implemented at campaign and line item levels.",
    category: "Optimization",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Brand Safety Settings",
    description: "Brand safety settings should be configured according to brand guidelines and category exclusions.",
    category: "Brand Safety",
    status: "active",
    priority: "high"
  },
  {
    platform: "DV360",
    title: "Viewability Optimization",
    description: "Viewability targets should be set and optimized according to campaign objectives.",
    category: "Optimization",
    status: "active",
    priority: "medium"
  }
];

async function main() {
  try {
    console.log('Importing real rules from previous application...');
    
    // Check for existing rules
    const existingRules = await prisma.rule.findMany();
    console.log(`Found ${existingRules.length} existing rules in the database.`);
    
    // Clear existing rules if requested
    const shouldClearExisting = process.argv.includes('--clear');
    if (shouldClearExisting && existingRules.length > 0) {
      console.log('Clearing existing rules...');
      
      // First delete related scores and change requests
      await prisma.changeRequest.deleteMany({
        where: {
          score: {
            rule: {
              id: {
                in: existingRules.map(rule => rule.id)
              }
            }
          }
        }
      });
      
      await prisma.score.deleteMany({
        where: {
          ruleId: {
            in: existingRules.map(rule => rule.id)
          }
        }
      });
      
      await prisma.rule.deleteMany();
      console.log('Existing rules cleared.');
    }
    
    // Import new rules
    let importedCount = 0;
    for (const ruleData of realRules) {
      // Check if rule already exists by title and platform
      const existingRule = await prisma.rule.findFirst({
        where: {
          title: ruleData.title,
          platform: ruleData.platform
        }
      });
      
      if (!existingRule) {
        await prisma.rule.create({
          data: ruleData
        });
        importedCount++;
        console.log(`Imported rule: ${ruleData.platform} - ${ruleData.title}`);
      } else {
        console.log(`Rule already exists: ${ruleData.platform} - ${ruleData.title}`);
      }
    }
    
    console.log(`Successfully imported ${importedCount} new rules.`);
  } catch (error) {
    console.error('Error importing rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
