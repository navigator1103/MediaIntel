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
          // TV Demographics & Targeting
          tvDemoGender: '', // To be filled manually
          tvDemoMinAge: '', // To be filled manually
          tvDemoMaxAge: '', // To be filled manually
          tvSel: '', // To be filled manually
          finalTvTarget: '', // To be filled manually
          tvTargetSize: '', // To be filled manually
          tvCopyLength: '', // To be filled manually
          // TV Performance Metrics
          tvPlannedR1Plus: '', // To be filled manually
          tvPlannedR3Plus: '', // To be filled manually
          tvPotentialR1Plus: '', // To be filled manually
          cpp2024: '', // To be filled manually
          cpp2025: '', // To be filled manually
          cpp2026: '', // To be filled manually
          reportedCurrency: '', // To be filled manually
          // Digital Demographics & Targeting
          isDigitalTargetSameAsTv: '', // To be filled manually
          digitalDemoGender: '', // To be filled manually
          digitalDemoMinAge: '', // To be filled manually
          digitalDemoMaxAge: '', // To be filled manually
          digitalSel: '', // To be filled manually
          finalDigitalTarget: '', // To be filled manually
          digitalTargetSizeAbs: '', // To be filled manually
          // Digital Performance Metrics
          digitalPlannedR1Plus: '', // To be filled manually
          digitalPotentialR1Plus: '', // To be filled manually
          // Combined Metrics
          plannedCombinedReach: '', // To be filled manually
          combinedPotentialReach: '', // To be filled manually
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
      'TV Demo Gender', 'TV Demo Min. Age', 'TV Demo Max. Age', 'TV SEL', 
      'Final TV Target (don\'t fill)', 'TV Target Size', 'TV Copy Length',
      'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Potential R1+',
      'CPP 2024', 'CPP 2025', 'CPP 2026', 'Reported Currency',
      'Is Digital target the same than TV?', 'Digital Demo Gender', 'Digital Demo Min. Age', 
      'Digital Demo Max. Age', 'Digital SEL', 'Final Digital Target (don\'t fill)',
      'Digital Target Size (Abs)', 'Total Digital Planned R1+', 'Total Digital Potential R1+',
      'Planned Combined Reach', 'Combined Potential Reach'
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
        item.tvDemoGender,
        item.tvDemoMinAge,
        item.tvDemoMaxAge,
        item.tvSel,
        item.finalTvTarget,
        item.tvTargetSize,
        item.tvCopyLength,
        item.tvPlannedR1Plus,
        item.tvPlannedR3Plus,
        item.tvPotentialR1Plus,
        item.cpp2024,
        item.cpp2025,
        item.cpp2026,
        item.reportedCurrency,
        item.isDigitalTargetSameAsTv,
        item.digitalDemoGender,
        item.digitalDemoMinAge,
        item.digitalDemoMaxAge,
        item.digitalSel,
        item.finalDigitalTarget,
        item.digitalTargetSizeAbs,
        item.digitalPlannedR1Plus,
        item.digitalPotentialR1Plus,
        item.plannedCombinedReach,
        item.combinedPotentialReach
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