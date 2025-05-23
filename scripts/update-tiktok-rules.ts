import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTikTokRules() {
  try {
    console.log('Updating TikTok rules...');

    // Define the TikTok rules based on the provided information
    const tiktokRules = [
      {
        id: 27, // Starting from ID 27 to avoid conflicts with Meta and DV360 rules
        platform: 'TikTok',
        title: 'Cap frequency to avoid overexposure for KNOW campaigns',
        description: 'Cap frequency to avoid overexposure for KNOW campaigns with vCPM/CPCV as main KPI at max. 3/week (if technically possible)',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'high'
      },
      {
        id: 28,
        platform: 'TikTok',
        title: 'Target at least 2 audiences in KNOW and WANT',
        description: 'Target at least 2 audiences in KNOW as well as in WANT (if applicable)',
        category: 'Audience',
        status: 'active',
        priority: 'high'
      },
      {
        id: 29,
        platform: 'TikTok',
        title: 'Utilize retargeting and lookalike audiences',
        description: 'Utilize retargeting and lookalike audiences',
        category: 'Audience',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 30,
        platform: 'TikTok',
        title: 'Use at least 2 variants of creatives for each ad type',
        description: 'Use at least 2 variants of creatives for each ad type per mutually exclusive audience in each funnel stage. When possible, add additional creative variants to enrich learnings and avoid ad fatigue',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 31,
        platform: 'TikTok',
        title: 'Limit video length to max. 15 seconds in KNOW and GET',
        description: 'Limit video length to max. 15 seconds in KNOW and GET. If mandatory, you can use longer video in WANT (max. 34 seconds)',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 32,
        platform: 'TikTok',
        title: 'Avoid spend during early morning hours',
        description: 'Avoid spend during early morning hours (2-6am) in KNOW/WANT campaign which don\'t have a website conversion (e.g., 30s visit) as objective',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 33,
        platform: 'TikTok',
        title: 'Ensure min. 6 weeks in-flight per ad group',
        description: 'Ensure min. 6 weeks in-flight per ad group to maximize optimization. If performance is declining, consider refreshing creative variants to counteract ad fatigue',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 34,
        platform: 'TikTok',
        title: 'Run Brand Lift studies whenever budget thresholds are met',
        description: 'Run Brand Lift studies whenever budget thresholds are met to enrich campaign assessment/ROA',
        category: 'Measurement',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 35,
        platform: 'TikTok',
        title: 'Cap CPA/CPO/vCPCV/vCPM bids based on historical media KPIs',
        description: 'Cap CPA/CPO/vCPCV/vCPM bids based on your historical media KPIs (if technically possible). Cross-check with your Agency/TikTok POC or Global Media to find out industry averages',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 36,
        platform: 'TikTok',
        title: 'Always use auction bidding, avoid Reach & Frequency or Reservation',
        description: 'Always use auction bidding, avoid Reach & Frequency or Reservation unless it is the only option (e.g., TopView or Top Feed)',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 37,
        platform: 'TikTok',
        title: 'Ensure bidding towards the right campaign KPI',
        description: 'Ensure bidding towards the right campaign KPI depending on the campaign objective (e.g., vCPM/vCPCV/CPO/CPA)',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      }
    ];

    // Update each rule in the database
    for (const rule of tiktokRules) {
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

    console.log('TikTok rules updated successfully');
  } catch (error) {
    console.error('Error updating TikTok rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTikTokRules()
  .then(() => console.log('Update completed'))
  .catch((error) => console.error('Update failed:', error));
