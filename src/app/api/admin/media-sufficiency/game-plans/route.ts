import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createCountryWhereClause } from '@/lib/auth/countryAccess';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lastUpdateId = searchParams.get('lastUpdateId');
    const showAll = searchParams.get('showAll') === 'true';
    
    // Get user access information for country filtering
    const userAccess = await getUserFromRequest(request);
    console.log('Game Plans API - User access:', userAccess);
    
    // If no specific lastUpdateId is provided, get the most recent one
    let whereClause: any = {};
    
    // Add country filtering based on user access
    if (userAccess) {
      const countryFilter = createCountryWhereClause(userAccess);
      Object.assign(whereClause, countryFilter);
      console.log('Game Plans API - Applied country filter:', countryFilter);
    }
    
    if (showAll) {
      // Show all data regardless of lastUpdateId, but keep country filter
      // Don't reset whereClause completely, just don't add lastUpdateId filter
    } else if (lastUpdateId) {
      whereClause.last_update_id = parseInt(lastUpdateId);
    } else {
      // Get the most recent lastUpdateId from game plans
      const mostRecentGamePlan = await prisma.gamePlan.findFirst({
        where: {
          last_update_id: { not: null }
        },
        orderBy: {
          id: 'desc'
        }
      });
      
      if (mostRecentGamePlan?.last_update_id) {
        whereClause.last_update_id = mostRecentGamePlan.last_update_id;
      }
    }
    
    // Fetch game plans with related data
    const gamePlans = await prisma.gamePlan.findMany({
      where: whereClause,
      include: {
        campaign: {
          include: {
            range: true
          }
        },
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        country: true,
        pmType: true,
        campaignArchetype: true,
        lastUpdate: true,
        category: {
          include: {
            businessUnit: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });


    // Get available lastUpdateIds for filtering
    const availableUpdates = await prisma.gamePlan.findMany({
      where: {
        last_update_id: { not: null }
      },
      select: {
        last_update_id: true,
        lastUpdate: true
      },
      distinct: ['last_update_id'],
      orderBy: {
        last_update_id: 'desc'
      }
    });

    return NextResponse.json({
      gamePlans: gamePlans,
      availableUpdates: availableUpdates.filter(u => u.last_update_id !== null),
      currentFilter: whereClause.last_update_id || null
    });
  } catch (error) {
    console.error('Error fetching game plans data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game plans data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { gamePlans } = await request.json();
    
    if (!Array.isArray(gamePlans) || gamePlans.length === 0) {
      return NextResponse.json(
        { error: 'Invalid game plans data' },
        { status: 400 }
      );
    }
    
    // Process updates in sequence
    const results = [];
    
    for (const plan of gamePlans) {
      // Extract only the fields that can be updated directly
      // Exclude nested objects and relations
      const {
        id,
        burst,
        startDate,
        endDate,
        totalBudget,
        janBudget,
        febBudget,
        marBudget,
        aprBudget,
        mayBudget,
        junBudget,
        julBudget,
        augBudget,
        sepBudget,
        octBudget,
        novBudget,
        decBudget,
        totalTrps,
        totalR1Plus,
        totalR3Plus,
        totalWoa,
        totalWoff,
        totalWeeks,
        weeksOffAir,
        year,
        playbook_id,
        // Add other editable fields here
      } = plan;
      
      if (!id) continue; // Skip items without ID
      
      try {
        const updatedPlan = await prisma.gamePlan.update({
          where: { id },
          data: {
            burst,
            startDate,
            endDate,
            totalBudget,
            janBudget,
            febBudget,
            marBudget,
            aprBudget,
            mayBudget,
            junBudget,
            julBudget,
            augBudget,
            sepBudget,
            octBudget,
            novBudget,
            decBudget,
            totalTrps,
            totalR1Plus,
            totalR3Plus,
            totalWoa,
            totalWoff,
            totalWeeks,
            weeksOffAir,
            year,
            playbook_id,
            // Add other editable fields here
          },
        });
        
        results.push({
          id,
          success: true,
          data: updatedPlan,
        });
      } catch (error) {
        console.error(`Error updating game plan ${id}:`, error);
        results.push({
          id,
          success: false,
          error: 'Failed to update game plan',
        });
      }
    }
    
    return NextResponse.json({
      message: 'Game plans updated',
      results,
    });
  } catch (error) {
    console.error('Error updating game plans:', error);
    return NextResponse.json(
      { error: 'Failed to update game plans' },
      { status: 500 }
    );
  }
}
