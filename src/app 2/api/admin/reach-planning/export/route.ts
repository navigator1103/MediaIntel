import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { countryId, lastUpdateId } = await request.json();

    if (!countryId) {
      return NextResponse.json(
        { error: 'Country ID is required' },
        { status: 400 }
      );
    }

    if (!lastUpdateId) {
      return NextResponse.json(
        { error: 'Financial Cycle (Last Update ID) is required' },
        { status: 400 }
      );
    }

    console.log('Export request for countryId:', countryId, 'lastUpdateId:', lastUpdateId);

    // Fetch the last update to get sub region and other data
    const lastUpdate = await prisma.lastUpdate.findUnique({
      where: {
        id: parseInt(lastUpdateId)
      }
    });

    if (!lastUpdate) {
      return NextResponse.json(
        { error: 'Financial cycle not found' },
        { status: 404 }
      );
    }

    // Fetch country with sub region information
    const countryWithRegion = await prisma.country.findUnique({
      where: {
        id: parseInt(countryId)
      },
      include: {
        subRegion: true
      }
    });

    // Fetch game plans for the selected country and financial cycle with all related data
    const gamePlans = await prisma.gamePlan.findMany({
      where: {
        countryId: parseInt(countryId),
        last_update_id: parseInt(lastUpdateId)
      },
      include: {
        campaign: {
          include: {
            range: {
              include: {
                categories: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        },
        country: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        pmType: true,
        category: true
      }
    });

    console.log('Found game plans:', gamePlans.length);

    if (gamePlans.length === 0) {
      return NextResponse.json(
        { error: `No game plans found for the selected country (ID: ${countryId}) and financial cycle (ID: ${lastUpdateId})` },
        { status: 404 }
      );
    }

    // Consolidate game plans by unique combination of Country + Category + Range + Campaign
    const consolidatedMap = new Map();

    gamePlans.forEach(plan => {
      // Create a unique key for consolidation
      const country = plan.country?.name || '';
      const category = plan.category?.name || 
                      (plan.campaign?.range?.categories && plan.campaign.range.categories.length > 0 
                        ? plan.campaign.range.categories[0].category.name 
                        : '') || '';
      const range = plan.campaign?.range?.name || '';
      const campaign = plan.campaign?.name || '';
      
      const key = `${country}|${category}|${range}|${campaign}`;
      
      if (!consolidatedMap.has(key)) {
        // First occurrence - create consolidated entry
        consolidatedMap.set(key, {
          lastUpdate: lastUpdate.name, // Use actual financial cycle name
          subRegion: countryWithRegion?.subRegion?.name || '', // Use actual sub region
          country: country,
          bu: '', // To be filled manually  
          category: category,
          range: range,
          campaign: campaign,
          franchiseNs: '', // To be filled manually
          campaignSocioDemoTarget: '', // To be filled manually
          totalCountryPopulationOnTarget: '', // To be filled manually
          tvCopyLength: '', // To be filled manually
          tvTargetSize: '', // To be filled manually
          woaOpenTv: '', // To be filled manually
          woaPaidTv: '', // To be filled manually
          totalTrps: '', // To be filled manually
          tvR1Plus: '', // To be filled manually
          tvR3Plus: '', // To be filled manually
          tvIdealReach: '', // To be filled manually
          cpp2024: '', // To be filled manually
          cpp2025: '', // To be filled manually
          digitalTarget: '', // To be filled manually
          digitalTargetSize: '', // To be filled manually
          woaPmFf: '', // To be filled manually
          woaInfluencersAmplification: '', // To be filled manually
          digitalR1Plus: '', // To be filled manually
          digitalIdealReach: '', // To be filled manually
          plannedCombinedReach: '', // To be filled manually
          combinedIdealReach: '', // To be filled manually
          digitalReachLevelCheck: '', // To be filled manually
          tvReachLevelCheck: '', // To be filled manually
          combinedReachLevelCheck: '', // To be filled manually
          // Store metadata about source game plans
          _sourceBursts: [plan.burst || 1],
          _sourceGamePlans: [plan.id]
        });
      } else {
        // Subsequent occurrence - add burst info
        const existing = consolidatedMap.get(key);
        existing._sourceBursts.push(plan.burst || 1);
        existing._sourceGamePlans.push(plan.id);
      }
    });

    // Convert map to array and add burst count information
    const consolidatedData = Array.from(consolidatedMap.values()).map(item => {
      const totalBursts = item._sourceBursts.length;
      const uniqueBursts = [...new Set(item._sourceBursts)].length;
      
      // Remove metadata fields before export
      const { _sourceBursts, _sourceGamePlans, ...exportItem } = item;
      
      return {
        ...exportItem,
        // Add a note about the consolidation in a comment field
        _consolidationNote: `Consolidated from ${totalBursts} game plan entries (${uniqueBursts} unique bursts)`
      };
    });

    // Generate CSV content
    const headers = [
      'Last Update', 'Sub Region', 'Country', 'BU', 'Category', 'Range', 'Campaign',
      'Franchise NS', 'Campaign Socio-Demo Target', 'Total Country Population On Target',
      'TV Copy Length', 'TV Target Size', 'WOA Open TV', 'WOA Paid TV', 'Total TRPs',
      'TV R1+', 'TV R3+', 'TV Ideal Reach', 'CPP 2024', 'CPP 2025', 'Digital Target',
      'Digital Target Size', 'WOA PM FF', 'WOA Influencers Amplification', 'Digital R1+',
      'Digital Ideal Reach', 'Planned Combined Reach', 'Combined Ideal Reach',
      'Digital Reach Level Check', 'TV Reach Level Check', 'Combined Reach Level Check'
    ];

    const csvRows = [
      headers.join(','),
      ...consolidatedData.map(item => [
        item.lastUpdate,
        item.subRegion,
        item.country,
        item.bu,
        item.category,
        item.range,
        item.campaign,
        item.franchiseNs,
        item.campaignSocioDemoTarget,
        item.totalCountryPopulationOnTarget,
        item.tvCopyLength,
        item.tvTargetSize,
        item.woaOpenTv,
        item.woaPaidTv,
        item.totalTrps,
        item.tvR1Plus,
        item.tvR3Plus,
        item.tvIdealReach,
        item.cpp2024,
        item.cpp2025,
        item.digitalTarget,
        item.digitalTargetSize,
        item.woaPmFf,
        item.woaInfluencersAmplification,
        item.digitalR1Plus,
        item.digitalIdealReach,
        item.plannedCombinedReach,
        item.combinedIdealReach,
        item.digitalReachLevelCheck,
        item.tvReachLevelCheck,
        item.combinedReachLevelCheck
      ].map(field => `"${field}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');

    const country = gamePlans[0]?.country?.name || 'unknown';
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="media-sufficiency-template-${country}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error generating export:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { 
        error: 'Failed to generate export', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}