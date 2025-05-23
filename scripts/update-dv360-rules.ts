import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDV360Rules() {
  try {
    console.log('Updating Google DV360 rules...');

    // Define the Google DV360 rules based on the provided information
    const dv360Rules = [
      {
        id: 14, // Starting from ID 14 to avoid conflicts with Meta rules
        platform: 'Google DV360',
        title: 'Cap frequency to avoid overexposure for KNOW campaigns',
        description: 'Cap frequency to avoid overexposure for KNOW campaigns with vCPM/CPCV as main KPI at max. 3/week',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'high'
      },
      {
        id: 15,
        platform: 'Google DV360',
        title: 'Use at least 2 audience signals in KNOW and WANT',
        description: 'Use at least 2 audience signals in KNOW as well as in WANT (e.g., Gender + Age in KNOW or Age + Market in WANT) (if applicable)',
        category: 'Audience',
        status: 'active',
        priority: 'high'
      },
      {
        id: 16,
        platform: 'Google DV360',
        title: 'Utilize retargeting audiences and Optimized Targeting',
        description: 'Utilize retargeting audiences. Opt-in to Optimized Targeting in GET. If applicable use Audience Expansion in KNOW and WANT. In case of other DSPs besides DV360 continue to use Lookalikes.',
        category: 'Audience',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 17,
        platform: 'Google DV360',
        title: 'Use at least 2 variants of creatives for each ad type',
        description: 'Use at least 2 variants of creatives for each ad type per audience in each funnel stage. When possible, add additional creative variants to enrich learnings and avoid ad fatigue',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 18,
        platform: 'Google DV360',
        title: 'Limit video length to max. 20 sec.',
        description: 'Limit video length to max. 20 sec. in KNOW, WANT, and GET',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 19,
        platform: 'Google DV360',
        title: 'Avoid spend during early morning hours',
        description: 'Avoid spend during early morning hours (2-6am) in KNOW/WANT campaign which don\'t have a website conversion (e.g., 30s visit) as objective',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 20,
        platform: 'Google DV360',
        title: 'Ensure minimum 6 weeks in-flight per line item/IO',
        description: 'Ensure minimum 6 weeks in-flight per line item/IO to maximize in-auction opportunities',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 21,
        platform: 'Google DV360',
        title: 'For YouTube, ensure non-performing content on exclusion list',
        description: 'For YouTube, ensure non-performing content on exclusion list (e.g., kids)',
        category: 'Brand Safety',
        status: 'active',
        priority: 'high'
      },
      {
        id: 22,
        platform: 'Google DV360',
        title: 'Ensure at least 60% viewability for Video & 70% for display',
        description: 'Ensure at least 60% viewability for Video & 70% for display',
        category: 'Viewability',
        status: 'active',
        priority: 'high'
      },
      {
        id: 23,
        platform: 'Google DV360',
        title: 'Exclude low perf. placements and/or devices',
        description: 'Exclude low perf. placements and / or devices',
        category: 'Optimization',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 24,
        platform: 'Google DV360',
        title: 'Run Brand Lift studies whenever budget thresholds are met',
        description: 'Run Brand Lift studies whenever budget thresholds are met to enrich campaign assessment/ROA (if technically possible on the platform/DSP)',
        category: 'Measurement',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 25,
        platform: 'Google DV360',
        title: 'Cap CPA/CPO/vCPCV/vCPM bids based on historical media KPIs',
        description: 'Cap CPA/CPO/vCPCV/vCPM bids based on your historical media KPIs (if technically possible). Cross-check with your Agency/Google POC to find out industry averages',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 26,
        platform: 'Google DV360',
        title: 'Ensure automated bidding towards the right campaign KPI',
        description: 'Ensure automated bidding towards the right campaign KPI depending on campaign objective (vCPM/vCPCV/CPO/CPA)',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      }
    ];

    // Update each rule in the database
    for (const rule of dv360Rules) {
      await prisma.rule.upsert({
        where: { id: rule.id },
        update: {
          platform: rule.platform,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          status: rule.status,
          priority: rule.priority
        },
        create: {
          id: rule.id,
          platform: rule.platform,
          title: rule.title,
          description: rule.description,
          category: rule.category,
          status: rule.status,
          priority: rule.priority
        }
      });
    }

    console.log('Google DV360 rules updated successfully');
  } catch (error) {
    console.error('Error updating Google DV360 rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDV360Rules()
  .then(() => console.log('Update completed'))
  .catch((error) => console.error('Update failed:', error));
