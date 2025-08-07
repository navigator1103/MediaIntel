import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createCountryWhereClause, filterCountriesByAccess } from '@/lib/auth/countryAccess';

export async function GET(request: NextRequest) {
  try {
    // Get user access information for country filtering
    const userAccess = await getUserFromRequest(request);
    
    // Build query filter based on accessible countries
    const whereClause = userAccess ? createCountryWhereClause(userAccess) : {};
    
    // Fetch game plans with related data, filtered by accessible countries
    const gamePlans = await prisma.gamePlan.findMany({
      where: whereClause,
      include: {
        campaign: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        country: true,
        pmType: true,
      }
    });

    // Enhanced game plans with category information
    const enhancedGamePlans = await Promise.all(gamePlans.map(async (plan) => {
      if (!plan.category && plan.category_id) {
        try {
          const category = await prisma.category.findUnique({
            where: { id: plan.category_id }
          });
          return { ...plan, category };
        } catch (err) {
          console.error('Error fetching category for game plan:', err);
          return plan;
        }
      }
      return plan;
    }));

    // Calculate aggregated data for dashboard
    const budgetByMediaType: Record<string, number> = {};
    const budgetByCountry: Record<string, number> = {};
    const budgetByCategory: Record<string, number> = {};
    const budgetByQuarter = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const campaignsByPMType: Record<string, number> = {};

    let totalBudget = 0;
    const mediaTypes = new Set<string>();
    const countries = new Set<string>();
    const campaigns = new Set<string>();

    enhancedGamePlans.forEach(plan => {
      const budget = plan.totalBudget || 0;
      totalBudget += budget;

      // Budget by media type
      const mediaTypeName = plan.mediaSubType?.mediaType?.name || 'Unknown';
      budgetByMediaType[mediaTypeName] = (budgetByMediaType[mediaTypeName] || 0) + budget;
      mediaTypes.add(mediaTypeName);

      // Budget by country
      const countryName = plan.country?.name || 'Unknown';
      budgetByCountry[countryName] = (budgetByCountry[countryName] || 0) + budget;
      countries.add(countryName);

      // Budget by category
      const categoryName = (plan as any).category?.name || 'Unknown';
      budgetByCategory[categoryName] = (budgetByCategory[categoryName] || 0) + budget;

      // Budget by quarter (calculated from monthly budgets)
      budgetByQuarter.Q1 += (plan.janBudget || 0) + (plan.febBudget || 0) + (plan.marBudget || 0);
      budgetByQuarter.Q2 += (plan.aprBudget || 0) + (plan.mayBudget || 0) + (plan.junBudget || 0);
      budgetByQuarter.Q3 += (plan.julBudget || 0) + (plan.augBudget || 0) + (plan.sepBudget || 0);
      budgetByQuarter.Q4 += (plan.octBudget || 0) + (plan.novBudget || 0) + (plan.decBudget || 0);

      // Campaigns by PM Type
      const pmTypeName = plan.pmType?.name || 'Unknown';
      campaignsByPMType[pmTypeName] = (campaignsByPMType[pmTypeName] || 0) + 1;

      // Track unique campaigns
      if (plan.campaign?.name) {
        campaigns.add(plan.campaign.name);
      }
    });

    // Calculate budget by category percentage
    const budgetByCategoryPercentage: Record<string, number> = {};
    Object.keys(budgetByCategory).forEach(category => {
      budgetByCategoryPercentage[category] = totalBudget > 0 
        ? (budgetByCategory[category] / totalBudget) * 100 
        : 0;
    });

    // Get list of accessible countries for the frontend filter
    const accessibleCountries = userAccess ? await filterCountriesByAccess(userAccess) : null;
    
    const dashboardData = {
      budgetByMediaType,
      budgetByCountry,
      budgetByCategory,
      budgetByCategoryPercentage,
      budgetByQuarter,
      campaignsByPMType,
      accessibleCountries: accessibleCountries?.map(c => c.name) || null, // Include accessible country names for frontend
      summary: {
        totalBudget,
        campaignCount: campaigns.size,
        mediaTypeCount: mediaTypes.size,
        countryCount: countries.size,
        gamePlanCount: enhancedGamePlans.length,
        lastUpdate: new Date().toISOString()
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching media sufficiency dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}