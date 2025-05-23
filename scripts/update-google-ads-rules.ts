import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGoogleAdsRules() {
  try {
    console.log('Updating Google Ads rules...');

    // Define the Google Ads rules based on the provided information
    const googleAdsRules = [
      {
        id: 38, // Starting from ID 38 to avoid conflicts with other platform rules
        platform: 'Google Ads',
        title: 'Create 1st party audiences with retargeting and Customer Match',
        description: 'Create 1st party audiences (Retargeting + Customer Match). Leverage retargeting and 3rd party data audiences in observation mode to enrich campaign learnings and to exclude low performing ones',
        category: 'Audience',
        status: 'active',
        priority: 'high'
      },
      {
        id: 39,
        platform: 'Google Ads',
        title: 'Ensure brand is present in at least one headline per ad',
        description: 'Ensure brand is present in at least one headline per ad (but remember, RSAs choose headlines for you). Also always utilise \'business logo\' ad feature',
        category: 'Creative',
        status: 'active',
        priority: 'high'
      },
      {
        id: 40,
        platform: 'Google Ads',
        title: 'Ensure Ad Strength is at least "Good"',
        description: 'Ensure Ad Strength is at least "Good" (ideally "Excellent") for 70%+ of ad spend and a Quality Score >7 for at least 55% of the budget (ideally up to 70%). Maximize consistency of keywords, ad and LP',
        category: 'Quality',
        status: 'active',
        priority: 'high'
      },
      {
        id: 41,
        platform: 'Google Ads',
        title: 'Use Exact and Phrase Match, use Broad Match only under Smart Bidding',
        description: 'Use Exact and Phrase Match, and use Broad Match only under Smart Bidding and close control of search terms - Broad Match shouldn\'t represent >30% of the budget, continuous testing recommended',
        category: 'Keywords',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 42,
        platform: 'Google Ads',
        title: 'RSA usage should be maximised wherever possible',
        description: 'RSA usage should be maximised wherever possible. Use DSA campaigns excluding keywords used in exact match (DSA shouldn\'t represent more than 15% of the budget on key categories - Face, Sun, Body, Men)',
        category: 'Creative',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 43,
        platform: 'Google Ads',
        title: 'All major ad extensions should be leveraged on every campaign',
        description: 'All major ad extensions relevant to our business & brands should be leveraged on every campaign (sitelinks, callouts etc). Periodically review Google \'Creative Excellence Recommendation\' guidelines',
        category: 'Extensions',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 44,
        platform: 'Google Ads',
        title: 'Use Smart Bidding',
        description: 'Use Smart Bidding - if this is not yet available in your territory you must avoid keywords appearing in multiple ad groups & exclude spend at low performing hours if CPA is 30%+ above campaign',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 45,
        platform: 'Google Ads',
        title: 'Aim always on for ROAS/CPA targets',
        description: 'Aim always on for ROAS, if short-term campaign, ensure minimally 6 weeks in-flight to maximize optimization',
        category: 'Campaign Settings',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 46,
        platform: 'Google Ads',
        title: 'Unless there is significant competition in your branded terms, do not bid on exact branded terms',
        description: 'Unless there is significant competition in your branded terms, do not bid on exact branded terms with #1 organic rank in Desktop. Always use incremental testing to validate ROI',
        category: 'Bidding',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 47,
        platform: 'Google Ads',
        title: 'Cap CPC bid to reflect product economics',
        description: 'Cap CPC bid to reflect product economics even in tCPA/tROAS strategy (use portfolio bid strategies) - exclude known test cases',
        category: 'Bidding',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 48,
        platform: 'Google Ads',
        title: 'Ensure automated bidding towards the right campaign KPI',
        description: 'Ensure automated bidding towards the right campaign KPI depending on the campaign objective (tCPO/tCPA) and DSA campaigns',
        category: 'Bidding',
        status: 'active',
        priority: 'high'
      },
      {
        id: 49,
        platform: 'Google Ads',
        title: 'Use qualification metrics per stage of funnel',
        description: 'Use qualification metrics per stage of funnel (e.g., tCPO/tCPA) as proxies for conversions where needed',
        category: 'Measurement',
        status: 'active',
        priority: 'medium'
      },
      {
        id: 50,
        platform: 'Google Ads',
        title: 'Update negative keywords frequently',
        description: 'Update negative keywords frequently (<6 months since last update) based on non-performing search terms. 100% compliance on Face, Sun, Body, Men related campaigns',
        category: 'Keywords',
        status: 'active',
        priority: 'medium'
      }
    ];

    // Update each rule in the database
    for (const rule of googleAdsRules) {
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

    console.log('Google Ads rules updated successfully');
  } catch (error) {
    console.error('Error updating Google Ads rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGoogleAdsRules()
  .then(() => console.log('Update completed'))
  .catch((error) => console.error('Update failed:', error));
