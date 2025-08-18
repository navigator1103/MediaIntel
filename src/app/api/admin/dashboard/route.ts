import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createCountryWhereClause } from '@/lib/auth/countryAccess';

export async function GET(request: NextRequest) {
  try {
    // Get user access information for country filtering
    const userAccess = await getUserFromRequest(request);
    
    // Build query filter based on accessible countries
    const whereClause = userAccess ? createCountryWhereClause(userAccess) : {};

    // Get comprehensive data for financial cycle analysis
    const [gamePlansData, usersData, lastUpdatesData] = await Promise.all([
      // Get game plans with all relevant relationships for financial cycle grouping, filtered by accessible countries
      prisma.gamePlan.findMany({
        where: whereClause,
        include: {
          campaign: {
            include: {
              range: true
            }
          },
          country: true,
          mediaSubType: {
            include: {
              mediaType: true
            }
          },
          businessUnit: true,
          lastUpdate: true
        }
      }),
      
      // Get users count
      prisma.user.findMany({
        select: { id: true, role: true }
      }),

      // Get all last updates to understand financial cycles
      prisma.lastUpdate.findMany({
        select: { id: true, name: true }
      })
    ]);

    // Calculate basic statistics
    const totalGamePlans = gamePlansData.length;
    const totalBudget = gamePlansData.reduce((sum, plan) => sum + (plan.totalBudget || 0), 0);
    const uniqueCampaigns = new Set(gamePlansData.map(plan => plan.campaign?.name).filter(Boolean)).size;
    const uniqueCountries = new Set(gamePlansData.map(plan => plan.country?.name).filter(Boolean)).size;

    // Group game plans by financial cycles based on lastUpdate and year
    const financialCycleGroups: Record<string, {
      name: string;
      year: number;
      plans: typeof gamePlansData;
      totalGamePlans: number;
      totalCampaigns: number;
      totalBudget: number;
      countries: Set<string>;
      businessUnits: Set<string>;
      mediaTypes: Set<string>;
      lastUpdated?: string;
    }> = {};

    // Process each game plan and assign to financial cycles
    gamePlansData.forEach(plan => {
      // Determine financial cycle based on lastUpdate name and year
      let cycleKey = 'Unknown';
      let cycleName = 'Unknown Cycle';
      let cycleYear = plan.year || new Date().getFullYear();

      if (plan.lastUpdate?.name) {
        // Use lastUpdate name as primary financial cycle identifier
        cycleKey = plan.lastUpdate.name;
        cycleName = plan.lastUpdate.name;
        
        // Extract year from cycle name if present (e.g., "ABP 2026")
        const yearMatch = cycleName.match(/20\d{2}/);
        if (yearMatch) {
          cycleYear = parseInt(yearMatch[0]);
        }
      } else if (plan.year) {
        // Fallback to year-based grouping
        cycleKey = `Year-${plan.year}`;
        cycleName = `${plan.year} Cycle`;
        cycleYear = plan.year;
      }

      // Initialize cycle group if not exists
      if (!financialCycleGroups[cycleKey]) {
        financialCycleGroups[cycleKey] = {
          name: cycleName,
          year: cycleYear,
          plans: [],
          totalGamePlans: 0,
          totalCampaigns: 0,
          totalBudget: 0,
          countries: new Set(),
          businessUnits: new Set(),
          mediaTypes: new Set()
        };
      }

      const cycle = financialCycleGroups[cycleKey];
      cycle.plans.push(plan);
      cycle.totalGamePlans++;
      cycle.totalBudget += plan.totalBudget || 0;

      // Track unique values
      if (plan.country?.name) cycle.countries.add(plan.country.name);
      if (plan.businessUnit?.name) cycle.businessUnits.add(plan.businessUnit.name);
      if (plan.mediaSubType?.mediaType?.name) cycle.mediaTypes.add(plan.mediaSubType.mediaType.name);

      // Track last updated
      if (plan.updatedAt && (!cycle.lastUpdated || plan.updatedAt > cycle.lastUpdated)) {
        cycle.lastUpdated = plan.updatedAt;
      }
    });

    // Calculate unique campaigns per cycle
    Object.values(financialCycleGroups).forEach(cycle => {
      cycle.totalCampaigns = new Set(cycle.plans.map(plan => plan.campaign?.name).filter(Boolean)).size;
    });

    // Convert to final format
    const financialCycles = Object.entries(financialCycleGroups).map(([key, cycle]) => ({
      id: key,
      name: cycle.name,
      year: cycle.year,
      totalGamePlans: cycle.totalGamePlans,
      totalCampaigns: cycle.totalCampaigns,
      totalBudget: cycle.totalBudget,
      countriesCount: cycle.countries.size,
      businessUnitsCount: cycle.businessUnits.size,
      mediaTypesCount: cycle.mediaTypes.size,
      countries: Array.from(cycle.countries),
      businessUnits: Array.from(cycle.businessUnits),
      mediaTypes: Array.from(cycle.mediaTypes),
      lastUpdated: cycle.lastUpdated || new Date().toISOString()
    })).sort((a, b) => b.year - a.year); // Sort by year descending

    // Overall stats (filtered by user access)
    const overallStats = {
      totalUsers: usersData.length,
      totalAdmins: usersData.filter(u => ['admin', 'super_admin'].includes(u.role)).length,
      totalGamePlans,
      totalCampaigns: uniqueCampaigns,
      totalBudget,
      uniqueCountries,
      totalFinancialCycles: financialCycles.length,
      lastUpdated: new Date().toISOString(),
      // Include user access context for transparency
      userAccess: userAccess ? {
        userId: userAccess.userId,
        role: userAccess.role,
        hasCountryRestrictions: userAccess.accessibleCountries !== null,
        accessibleCountriesCount: userAccess.accessibleCountries ? 
          (Array.isArray(userAccess.accessibleCountries) ? userAccess.accessibleCountries.length : 1) : null
      } : null
    };

    return NextResponse.json({
      success: true,
      data: {
        overall: overallStats,
        financialCycles
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}