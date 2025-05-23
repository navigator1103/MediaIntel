import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMetaRules() {
  try {
    console.log('Updating Meta rules...');

    // Define the Meta rules based on the provided information
    const metaRules = [
      {
        id: 1,
        platform: 'Meta',
        title: 'Cap frequency to avoid overexposure for KNOW campaigns',
        description: 'Cap frequency to avoid overexposure for KNOW campaigns with vCPM/CPCV as main KPI at max. 3/week (if technically possible)',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'high'
      },
      {
        id: 2,
        platform: 'Meta',
        title: 'Use at least 2 audience signals in KNOW and WANT',
        description: 'Use at least 2 audience signals in KNOW as well as in WANT (if applicable)',
        category: 'Audience',
        status: 'active',
        priority: 'high'
      },
      {
        id: 3,
        platform: 'Meta',
        title: 'Utilize retargeting and lookalike audiences',
        description: 'Utilize retargeting and lookalike audiences',
        category: 'Audience',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 4,
        platform: 'Meta',
        title: 'Use at least 2 different ad formats for each KNOW and WANT',
        description: 'Use at least 2 different ad formats (e.g., Story + Carousel or Story + Feed) for each KNOW and WANT',
        category: 'Creative',
        status: 'active',
        priority: 'high'
      },
      {
        id: 5,
        platform: 'Meta',
        title: 'Use at least 2 variants of creatives for each ad type',
        description: 'Use at least 2 variants of creatives for each ad type per audience in each funnel stage. When possible, add additional creative variants to enrich learnings and avoid ad fatigue',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 6,
        platform: 'Meta',
        title: 'Limit video length to 6 seconds in KNOW stage',
        description: 'Limit video length to 6 seconds in KNOW stage; use longer video in WANT/GET phase (max. 15s)',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 7,
        platform: 'Meta',
        title: 'Avoid spend during early morning hours',
        description: 'Avoid spend during early morning hours (2-6am) in KNOW/WANT campaign which don\'t have a website conversion (e.g., 30s view) as objective',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 8,
        platform: 'Meta',
        title: 'Ensure minimum 6 weeks in-flight per adset',
        description: 'Ensure minimum 6 weeks in-flight per adset to maximize optimization',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 9,
        platform: 'Meta',
        title: 'Enable automatic placement functionality',
        description: 'Enable automatic placement functionality to generate insights on placements, later select best performing ones. Exception can be brand safety related placements',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 10,
        platform: 'Meta',
        title: 'Run Brand Lift studies when budget thresholds are met',
        description: 'Run Brand Lift studies whenever budget thresholds are met to enrich campaign assessment/ROA',
        category: 'Measurement',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 11,
        platform: 'Meta',
        title: 'Cap CPA/CPO/vCPCV/vCPM bids based on historical media KPIs',
        description: 'Cap CPA/CPO/vCPCV/vCPM bids based on your historical media KPIs (if technically possible). Cross-check with your Agency/META POC to find out industry averages',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 12,
        platform: 'Meta',
        title: 'Always use auction bidding, avoid Reach & Frequency or Reservation',
        description: 'Always use auction bidding, avoid Reach & Frequency or Reservation',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 13,
        platform: 'Meta',
        title: 'Ensure bidding towards the right campaign KPI',
        description: 'Ensure bidding towards the right campaign KPI depending on the campaign objective (e.g., vCPM/vCPCV/CPA)',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      }
    ];

    // Update each rule in the database
    for (const rule of metaRules) {
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

    console.log('Meta rules updated successfully');
  } catch (error) {
    console.error('Error updating Meta rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMetaRules()
  .then(() => console.log('Update completed'))
  .catch((error) => console.error('Update failed:', error));
