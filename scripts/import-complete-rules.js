// Script to import complete set of real rules from previous application
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Complete set of real rules from the previous application (14 per platform)
const completeRules = [
  // META RULES (14)
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
    platform: "Meta",
    title: "A/B Testing Implementation",
    description: "Proper A/B testing methodology should be used for creatives, audiences, and placements with statistical significance.",
    category: "Testing",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Ad Placement Optimization",
    description: "Ad placements should be optimized based on performance data with appropriate exclusions for underperforming placements.",
    category: "Optimization",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Creative Refresh Cadence",
    description: "Creative assets should be refreshed regularly to prevent ad fatigue, with a documented refresh schedule.",
    category: "Creative",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Bid Strategy Selection",
    description: "Appropriate bid strategies should be selected based on campaign objectives and available conversion data.",
    category: "Bidding",
    status: "active",
    priority: "high"
  },
  {
    platform: "Meta",
    title: "Landing Page Experience",
    description: "Landing pages should be optimized for mobile, have fast load times, and provide a seamless user experience.",
    category: "User Experience",
    status: "active",
    priority: "high"
  },
  {
    platform: "Meta",
    title: "Ad Copy Best Practices",
    description: "Ad copy should follow best practices including clear CTAs, value propositions, and appropriate character limits.",
    category: "Creative",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Reporting Dashboard Setup",
    description: "Comprehensive reporting dashboards should be set up with relevant metrics and regular automated reporting.",
    category: "Reporting",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Meta",
    title: "Compliance with Ad Policies",
    description: "All ads should comply with Meta's advertising policies and guidelines to prevent disapprovals and account issues.",
    category: "Compliance",
    status: "active",
    priority: "high"
  },
  {
    platform: "Meta",
    title: "Remarketing Strategy Implementation",
    description: "Comprehensive remarketing strategy should be implemented with appropriate audience segmentation and messaging.",
    category: "Remarketing",
    status: "active",
    priority: "medium"
  },

  // GOOGLE ADS RULES (14)
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
    platform: "Google Ads",
    title: "Quality Score Optimization",
    description: "Keywords should be optimized for quality score with focus on ad relevance, landing page experience, and CTR.",
    category: "Optimization",
    status: "active",
    priority: "high"
  },
  {
    platform: "Google Ads",
    title: "Bid Strategy Selection",
    description: "Appropriate automated bidding strategies should be selected based on campaign objectives and conversion data.",
    category: "Bidding",
    status: "active",
    priority: "high"
  },
  {
    platform: "Google Ads",
    title: "Budget Allocation",
    description: "Budget should be allocated efficiently across campaigns based on performance data and business priorities.",
    category: "Budget",
    status: "active",
    priority: "high"
  },
  {
    platform: "Google Ads",
    title: "Ad Schedule Optimization",
    description: "Ad schedules should be optimized based on performance data with bid adjustments for high-performing times.",
    category: "Optimization",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Device Bid Adjustments",
    description: "Device bid adjustments should be implemented based on performance data across devices.",
    category: "Bidding",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Audience Implementation",
    description: "Relevant audiences should be applied to campaigns including remarketing, in-market, and affinity audiences.",
    category: "Targeting",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Landing Page Relevance",
    description: "Landing pages should be highly relevant to ad content and keywords with clear CTAs and fast load times.",
    category: "User Experience",
    status: "active",
    priority: "high"
  },
  {
    platform: "Google Ads",
    title: "Regular Search Term Analysis",
    description: "Search term reports should be analyzed regularly to identify new keywords and negative keywords.",
    category: "Keywords",
    status: "active",
    priority: "medium"
  },
  {
    platform: "Google Ads",
    title: "Performance Max Implementation",
    description: "Performance Max campaigns should be properly set up with comprehensive asset groups and audience signals.",
    category: "Campaign Type",
    status: "active",
    priority: "medium"
  },

  // TIKTOK RULES (14)
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
    platform: "TikTok",
    title: "Native Content Approach",
    description: "Ad content should feel native to the platform, avoiding overly produced or traditional advertising formats.",
    category: "Creative",
    status: "active",
    priority: "high"
  },
  {
    platform: "TikTok",
    title: "Sound-On Strategy",
    description: "Creative should be designed for sound-on viewing with engaging audio elements.",
    category: "Creative",
    status: "active",
    priority: "high"
  },
  {
    platform: "TikTok",
    title: "Bid Strategy Optimization",
    description: "Appropriate bid strategies should be selected based on campaign objectives and available data.",
    category: "Bidding",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Creative Refresh Frequency",
    description: "Creative assets should be refreshed frequently to prevent ad fatigue and maintain engagement.",
    category: "Creative",
    status: "active",
    priority: "high"
  },
  {
    platform: "TikTok",
    title: "Campaign Budget Management",
    description: "Budgets should be allocated efficiently across campaigns based on performance data.",
    category: "Budget",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Spark Ads Implementation",
    description: "Spark Ads format should be used where possible to leverage organic content performance.",
    category: "Ad Format",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Hashtag Strategy",
    description: "Relevant and trending hashtags should be incorporated into ad content where appropriate.",
    category: "Creative",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Creator Collaboration Framework",
    description: "A structured approach to creator collaborations should be implemented with clear guidelines and measurement.",
    category: "Influencer",
    status: "active",
    priority: "medium"
  },
  {
    platform: "TikTok",
    title: "Landing Page Experience",
    description: "Landing pages should be mobile-optimized with fast load times and seamless user experience.",
    category: "User Experience",
    status: "active",
    priority: "high"
  },

  // DV360 RULES (14)
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
  },
  {
    platform: "DV360",
    title: "Audience Strategy",
    description: "Comprehensive audience strategy should be implemented using first-party, third-party, and contextual audiences.",
    category: "Targeting",
    status: "active",
    priority: "high"
  },
  {
    platform: "DV360",
    title: "Inventory Source Selection",
    description: "Appropriate inventory sources should be selected based on campaign objectives and brand safety requirements.",
    category: "Inventory",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Creative Format Strategy",
    description: "Diverse creative formats should be utilized including display, video, audio, and native formats.",
    category: "Creative",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Bid Strategy Implementation",
    description: "Appropriate bid strategies should be selected based on campaign objectives and available data.",
    category: "Bidding",
    status: "active",
    priority: "high"
  },
  {
    platform: "DV360",
    title: "Data-Driven Attribution",
    description: "Data-driven attribution models should be implemented where possible to optimize media allocation.",
    category: "Attribution",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Programmatic Guaranteed Setup",
    description: "Programmatic guaranteed deals should be properly set up with appropriate targeting and frequency settings.",
    category: "Deal Setup",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Cross-Device Measurement",
    description: "Cross-device measurement should be enabled to track user journeys across multiple devices.",
    category: "Measurement",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Creative Rotation Settings",
    description: "Appropriate creative rotation settings should be implemented based on campaign objectives.",
    category: "Creative",
    status: "active",
    priority: "medium"
  },
  {
    platform: "DV360",
    title: "Reporting Dashboard Setup",
    description: "Comprehensive reporting dashboards should be set up with relevant metrics and regular automated reporting.",
    category: "Reporting",
    status: "active",
    priority: "medium"
  }
];

async function main() {
  try {
    console.log('Importing complete set of real rules from previous application...');
    
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
    for (const ruleData of completeRules) {
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
    console.log(`Total rules in database: ${(await prisma.rule.count())}`);
    
    // Count rules by platform
    const metaRules = await prisma.rule.count({ where: { platform: 'Meta' } });
    const googleRules = await prisma.rule.count({ where: { platform: 'Google Ads' } });
    const tiktokRules = await prisma.rule.count({ where: { platform: 'TikTok' } });
    const dv360Rules = await prisma.rule.count({ where: { platform: 'DV360' } });
    
    console.log(`Rules by platform: Meta (${metaRules}), Google Ads (${googleRules}), TikTok (${tiktokRules}), DV360 (${dv360Rules})`);
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
