import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/getUserFromToken';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lastUpdatesParam = searchParams.get('lastUpdates');
    
    // Get user from token to check accessible countries
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Fetch full user data from database to get accessibleCountries
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        accessibleCountries: true
      }
    });
    
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse accessible countries
    let accessibleCountryIds: number[] = [];
    if (fullUser.accessibleCountries) {
      try {
        const parsed = typeof fullUser.accessibleCountries === 'string' 
          ? JSON.parse(fullUser.accessibleCountries) 
          : fullUser.accessibleCountries;
        
        // Handle both single number and array formats
        if (Array.isArray(parsed)) {
          accessibleCountryIds = parsed;
        } else if (typeof parsed === 'number') {
          accessibleCountryIds = [parsed];
        }
      } catch (e) {
        console.error('Error parsing accessible countries:', e);
        accessibleCountryIds = [];
      }
    }
    // Check if MediaSufficiency table has data
    const count = await prisma.MediaSufficiency.count();
    
    if (count === 0) {
      // Return empty structure if no data
      return NextResponse.json({
        summary: {
          totalRecords: 0,
          countries: 0,
          campaigns: 0,
          totalWoa: 0,
          totalWoff: 0,
          totalWeeks: 0
        },
        tvReachData: [],
        digitalReachData: [],
        combinedReachData: [],
        countryReachAnalysis: [],
        categoryReachAnalysis: []
      });
    }
    
    // Build where clause based on accessible countries and lastUpdate filter
    const whereClause: any = {};
    if (accessibleCountryIds.length > 0) {
      whereClause.countryId = {
        in: accessibleCountryIds
      };
    }
    
    // Add lastUpdate filter if provided
    if (lastUpdatesParam) {
      const lastUpdateNames = lastUpdatesParam.split(',');
      // First find the lastUpdate IDs for these names
      const lastUpdates = await prisma.lastUpdate.findMany({
        where: {
          name: {
            in: lastUpdateNames
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      if (lastUpdates.length > 0) {
        whereClause.lastUpdateId = {
          in: lastUpdates.map(lu => lu.id)
        };
      }
    }
    
    // Fetch all MediaSufficiency records with their reach data
    const mediaSufficiencyData = await prisma.MediaSufficiency.findMany({
      where: whereClause,
      select: {
        id: true,
        lastUpdate: true,
        country: true,
        countryId: true,
        category: true,
        range: true,
        campaign: true,
        tvPlannedR1Plus: true,
        tvPlannedR3Plus: true,
        tvPotentialR1Plus: true,
        tvTargetSize: true,
        digitalPlannedR1Plus: true,
        digitalPotentialR1Plus: true,
        digitalTargetSizeAbs: true,
        plannedCombinedReach: true,
        combinedPotentialReach: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get unique campaigns from mediaSufficiency data
    const uniqueCampaigns = [...new Set(mediaSufficiencyData.map(d => d.campaign).filter(Boolean))];
    
    // Fetch game plans for these campaigns to get WOA and Weeks data
    let gamePlansData: any[] = [];
    let campaignWoaMap: Record<string, { totalWoa: number; totalWoff: number; totalWeeks: number }> = {};
    
    if (uniqueCampaigns.length > 0) {
      // Fetch campaigns first to get their IDs
      const campaigns = await prisma.campaign.findMany({
        where: {
          name: {
            in: uniqueCampaigns
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      const campaignIdToName: Record<number, string> = {};
      campaigns.forEach(c => {
        campaignIdToName[c.id] = c.name;
      });
      
      const campaignIds = campaigns.map(c => c.id);
      
      // Build where clause for game plans with country filtering
      const gamePlanWhere: any = {
        campaignId: {
          in: campaignIds
        }
      };
      
      // Add country filter if user has restricted access
      if (accessibleCountryIds.length > 0) {
        gamePlanWhere.countryId = {
          in: accessibleCountryIds
        };
      }
      
      // Add lastUpdate filter to match the media sufficiency filter
      if (whereClause.lastUpdateId) {
        gamePlanWhere.last_update_id = whereClause.lastUpdateId;
      }
      
      // Now fetch game plans for these campaign IDs
      gamePlansData = await prisma.gamePlan.findMany({
        where: gamePlanWhere,
        select: {
          campaignId: true,
          totalWoa: true,
          totalWoff: true,
          totalWeeks: true
        }
      });
      
      // Build campaign WOA map
      gamePlansData.forEach(gp => {
        const campaignName = campaignIdToName[gp.campaignId];
        if (campaignName) {
          if (!campaignWoaMap[campaignName]) {
            campaignWoaMap[campaignName] = { totalWoa: 0, totalWoff: 0, totalWeeks: 0 };
          }
          campaignWoaMap[campaignName].totalWoa += gp.totalWoa || 0;
          campaignWoaMap[campaignName].totalWoff += gp.totalWoff || 0;
          campaignWoaMap[campaignName].totalWeeks += gp.totalWeeks || 0;
        }
      });
    }
    
    // Calculate aggregated WOA and Weeks metrics
    const totalWoa = gamePlansData.reduce((sum, gp) => sum + (gp.totalWoa || 0), 0);
    const totalWoff = gamePlansData.reduce((sum, gp) => sum + (gp.totalWoff || 0), 0);
    const totalWeeks = gamePlansData.reduce((sum, gp) => sum + (gp.totalWeeks || 0), 0);
    
    // Process data for charts
    const processedData = {
      // Summary stats
      summary: {
        totalRecords: mediaSufficiencyData.length,
        countries: [...new Set(mediaSufficiencyData.map(d => d.country).filter(Boolean))].length,
        campaigns: [...new Set(mediaSufficiencyData.map(d => d.campaign).filter(Boolean))].length,
        totalWoa: totalWoa,
        totalWoff: totalWoff,
        totalWeeks: totalWeeks
      },

      // TV Reach data for charts with calculated fields
      tvReachData: (() => {
        // Group by campaign to calculate sums
        const campaignGroups: Record<string, any[]> = {};
        mediaSufficiencyData
          .filter(d => d.tvPlannedR1Plus && d.tvPotentialR1Plus)
          .forEach(d => {
            const campaign = d.campaign || 'Unknown';
            if (!campaignGroups[campaign]) {
              campaignGroups[campaign] = [];
            }
            campaignGroups[campaign].push(d);
          });

        // Calculate for each campaign
        return Object.entries(campaignGroups).map(([campaign, records]) => {
          // Sum of TV Planned R1+ (convert % to decimal for calculation)
          const sumTvR1Plus = records.reduce((sum, d) => {
            return sum + (parseFloat(d.tvPlannedR1Plus?.replace('%', '') || '0') / 100);
          }, 0);

          // Sum of TV Target Size (convert to numbers)
          const sumTvTargetSize = records.reduce((sum, d) => {
            const targetSizeStr = d.tvTargetSize || '0';
            const targetSizeNum = parseFloat(targetSizeStr.replace(/[,%]/g, '') || '0');
            return sum + targetSizeNum;
          }, 0);

          // Calculate Reach Abs = Sum(TV R1+) × sum(TV Target Size)
          const reachAbs = sumTvR1Plus * sumTvTargetSize;

          // Potential = sum(TV Target Size)
          const potential = sumTvTargetSize;

          // Average potential reach for this campaign
          const avgIdealReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.tvPotentialR1Plus?.replace('%', '') || '0');
          }, 0) / records.length;

          // Current reach as percentage for chart display
          const avgCurrentReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.tvPlannedR1Plus?.replace('%', '') || '0');
          }, 0) / records.length;

          // Calculate gap manually
          const gap = avgIdealReach - avgCurrentReach;

          return {
            campaign,
            country: records[0]?.country || 'Unknown',
            category: records[0]?.category || 'Unknown',
            currentReach: avgCurrentReach, // For chart display
            idealReach: avgIdealReach, // For chart display
            gap: gap,
            reachAbs: reachAbs,
            potential: potential,
            sumTvR1Plus: sumTvR1Plus * 100, // Convert back to percentage for display
            sumTvTargetSize: sumTvTargetSize
          };
        });
      })(),

      // Digital Reach data for charts with calculated fields
      digitalReachData: (() => {
        // Group by campaign to calculate sums
        const campaignGroups: Record<string, any[]> = {};
        mediaSufficiencyData
          .filter(d => d.digitalPlannedR1Plus && d.digitalPotentialR1Plus)
          .forEach(d => {
            const campaign = d.campaign || 'Unknown';
            if (!campaignGroups[campaign]) {
              campaignGroups[campaign] = [];
            }
            campaignGroups[campaign].push(d);
          });

        // Calculate for each campaign
        return Object.entries(campaignGroups).map(([campaign, records]) => {
          // Sum of Digital Planned R1+ (convert % to decimal for calculation)
          const sumDigitalR1Plus = records.reduce((sum, d) => {
            return sum + (parseFloat(d.digitalPlannedR1Plus?.replace('%', '') || '0') / 100);
          }, 0);

          // Sum of Digital Target Size (convert to numbers)
          const sumDigitalTargetSize = records.reduce((sum, d) => {
            const targetSizeStr = d.digitalTargetSizeAbs || '0';
            const targetSizeNum = parseFloat(targetSizeStr.replace(/[,%]/g, '') || '0');
            return sum + targetSizeNum;
          }, 0);

          // Calculate Reach Abs = Sum(Digital R1+) × sum(Digital Target Size)
          const reachAbs = sumDigitalR1Plus * sumDigitalTargetSize;

          // Potential = sum(Digital Target Size)
          const potential = sumDigitalTargetSize;

          // Average potential reach for this campaign
          const avgIdealReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.digitalPotentialR1Plus?.replace('%', '') || '0');
          }, 0) / records.length;

          // Current reach as percentage for chart display
          const avgCurrentReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.digitalPlannedR1Plus?.replace('%', '') || '0');
          }, 0) / records.length;

          // Calculate gap manually
          const gap = avgIdealReach - avgCurrentReach;

          return {
            campaign,
            country: records[0]?.country || 'Unknown',
            category: records[0]?.category || 'Unknown',
            currentReach: avgCurrentReach, // For chart display
            idealReach: avgIdealReach, // For chart display
            gap: gap,
            reachAbs: reachAbs,
            potential: potential,
            sumDigitalR1Plus: sumDigitalR1Plus * 100, // Convert back to percentage for display
            sumDigitalTargetSize: sumDigitalTargetSize
          };
        });
      })(),

      // Combined Reach data for charts with calculated fields
      combinedReachData: (() => {
        // Group by campaign to calculate sums
        const campaignGroups: Record<string, any[]> = {};
        mediaSufficiencyData
          .filter(d => d.plannedCombinedReach && d.combinedPotentialReach)
          .forEach(d => {
            const campaign = d.campaign || 'Unknown';
            if (!campaignGroups[campaign]) {
              campaignGroups[campaign] = [];
            }
            campaignGroups[campaign].push(d);
          });

        // Calculate for each campaign
        return Object.entries(campaignGroups).map(([campaign, records]) => {
          // Sum of Planned Combined Reach (convert % to decimal for calculation)
          const sumPlannedCombinedReach = records.reduce((sum, d) => {
            return sum + (parseFloat(d.plannedCombinedReach?.replace('%', '') || '0') / 100);
          }, 0);

          // For potential, we'll use the average of TV and Digital target sizes 
          // since totalCountryPopulationOnTarget field doesn't exist
          const sumTotalCountryPopulation = records.reduce((sum, d) => {
            const tvSize = parseFloat(d.tvTargetSize?.replace(/[,%]/g, '') || '0');
            const digitalSize = parseFloat(d.digitalTargetSizeAbs?.replace(/[,%]/g, '') || '0');
            // Use the max of TV and Digital target size as approximation
            return sum + Math.max(tvSize, digitalSize);
          }, 0);

          // Calculate Reach Abs = sum(Planned Combined Reach) × sum(Total Country Population on Target)
          const reachAbs = sumPlannedCombinedReach * sumTotalCountryPopulation;

          // Potential = sum(Total Country Population on Target)
          const potential = sumTotalCountryPopulation;

          // Average potential reach for this campaign
          const avgIdealReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.combinedPotentialReach?.replace('%', '') || '0');
          }, 0) / records.length;

          // Current reach as percentage for chart display
          const avgCurrentReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.plannedCombinedReach?.replace('%', '') || '0');
          }, 0) / records.length;

          // Calculate gap manually
          const gap = avgIdealReach - avgCurrentReach;

          return {
            campaign,
            country: records[0]?.country || 'Unknown',
            category: records[0]?.category || 'Unknown',
            currentReach: avgCurrentReach, // For chart display
            idealReach: avgIdealReach, // For chart display
            gap: gap,
            reachAbs: reachAbs,
            potential: potential,
            sumPlannedCombinedReach: sumPlannedCombinedReach * 100, // Convert back to percentage for display
            sumTotalCountryPopulation: sumTotalCountryPopulation
          };
        });
      })(),

      // Country-wise reach analysis
      countryReachAnalysis: {},

      // Category-wise reach analysis
      categoryReachAnalysis: {}
    };

    // Process country-wise analysis
    const countriesMap: Record<string, any> = {};
    mediaSufficiencyData.forEach(d => {
      if (!d.country) return;
      
      if (!countriesMap[d.country]) {
        countriesMap[d.country] = {
          country: d.country,
          campaigns: 0,
          avgTvReach: 0,
          avgDigitalReach: 0,
          avgCombinedReach: 0,
          tvGap: 0,
          digitalGap: 0,
          combinedGap: 0,
          tvReachValues: [],
          digitalReachValues: [],
          combinedReachValues: [],
          tvGapValues: [],
          digitalGapValues: [],
          combinedGapValues: []
        };
      }

      countriesMap[d.country].campaigns++;

      // TV Reach
      if (d.tvPlannedR1Plus && d.tvPotentialR1Plus) {
        const current = parseFloat(d.tvPlannedR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.tvPotentialR1Plus.replace('%', '') || '0');
        const gap = ideal - current;
        
        countriesMap[d.country].tvReachValues.push({ current, ideal });
        countriesMap[d.country].tvGapValues.push(gap);
      }

      // Digital Reach
      if (d.digitalPlannedR1Plus && d.digitalPotentialR1Plus) {
        const current = parseFloat(d.digitalPlannedR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.digitalPotentialR1Plus.replace('%', '') || '0');
        const gap = ideal - current;
        
        countriesMap[d.country].digitalReachValues.push({ current, ideal });
        countriesMap[d.country].digitalGapValues.push(gap);
      }

      // Combined Reach
      if (d.plannedCombinedReach && d.combinedPotentialReach) {
        const current = parseFloat(d.plannedCombinedReach.replace('%', '') || '0');
        const ideal = parseFloat(d.combinedPotentialReach.replace('%', '') || '0');
        const gap = ideal - current;
        
        countriesMap[d.country].combinedReachValues.push({ current, ideal });
        countriesMap[d.country].combinedGapValues.push(gap);
      }
    });

    // Calculate averages for each country
    Object.values(countriesMap).forEach((country: any) => {
      // TV averages
      if (country.tvReachValues.length > 0) {
        country.avgTvReach = country.tvReachValues.reduce((sum: number, val: any) => sum + val.current, 0) / country.tvReachValues.length;
        country.avgTvIdeal = country.tvReachValues.reduce((sum: number, val: any) => sum + val.ideal, 0) / country.tvReachValues.length;
        country.tvGap = country.tvGapValues.reduce((sum: number, val: number) => sum + val, 0) / country.tvGapValues.length;
      }

      // Digital averages
      if (country.digitalReachValues.length > 0) {
        country.avgDigitalReach = country.digitalReachValues.reduce((sum: number, val: any) => sum + val.current, 0) / country.digitalReachValues.length;
        country.avgDigitalIdeal = country.digitalReachValues.reduce((sum: number, val: any) => sum + val.ideal, 0) / country.digitalReachValues.length;
        country.digitalGap = country.digitalGapValues.reduce((sum: number, val: number) => sum + val, 0) / country.digitalGapValues.length;
      }

      // Combined averages
      if (country.combinedReachValues.length > 0) {
        country.avgCombinedReach = country.combinedReachValues.reduce((sum: number, val: any) => sum + val.current, 0) / country.combinedReachValues.length;
        country.avgCombinedIdeal = country.combinedReachValues.reduce((sum: number, val: any) => sum + val.ideal, 0) / country.combinedReachValues.length;
        country.combinedGap = country.combinedGapValues.reduce((sum: number, val: number) => sum + val, 0) / country.combinedGapValues.length;
      }

      // Clean up temporary arrays
      delete country.tvReachValues;
      delete country.digitalReachValues;
      delete country.combinedReachValues;
      delete country.tvGapValues;
      delete country.digitalGapValues;
      delete country.combinedGapValues;
    });

    processedData.countryReachAnalysis = Object.values(countriesMap);

    // Process category-wise analysis (similar to country analysis)
    const categoriesMap: Record<string, any> = {};
    mediaSufficiencyData.forEach(d => {
      if (!d.category) return;
      
      if (!categoriesMap[d.category]) {
        categoriesMap[d.category] = {
          category: d.category,
          campaigns: 0,
          avgTvReach: 0,
          avgDigitalReach: 0,
          avgCombinedReach: 0,
          tvGap: 0,
          digitalGap: 0,
          combinedGap: 0,
          tvReachValues: [],
          digitalReachValues: [],
          combinedReachValues: [],
          tvGapValues: [],
          digitalGapValues: [],
          combinedGapValues: []
        };
      }

      categoriesMap[d.category].campaigns++;

      // Similar processing as countries...
      if (d.tvR1Plus && d.tvIdealReach) {
        const current = parseFloat(d.tvR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.tvIdealReach.replace('%', '') || '0');
        const gap = parseFloat(d.tvReachLevelCheck?.replace('%', '') || '0');
        
        categoriesMap[d.category].tvReachValues.push({ current, ideal });
        categoriesMap[d.category].tvGapValues.push(gap);
      }

      if (d.digitalPlannedR1Plus && d.digitalPotentialR1Plus) {
        const current = parseFloat(d.digitalPlannedR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.digitalPotentialR1Plus.replace('%', '') || '0');
        const gap = ideal - current;
        
        categoriesMap[d.category].digitalReachValues.push({ current, ideal });
        categoriesMap[d.category].digitalGapValues.push(gap);
      }

      if (d.plannedCombinedReach && d.combinedPotentialReach) {
        const current = parseFloat(d.plannedCombinedReach.replace('%', '') || '0');
        const ideal = parseFloat(d.combinedPotentialReach.replace('%', '') || '0');
        const gap = ideal - current;
        
        categoriesMap[d.category].combinedReachValues.push({ current, ideal });
        categoriesMap[d.category].combinedGapValues.push(gap);
      }
    });

    // Calculate averages for each category
    Object.values(categoriesMap).forEach((category: any) => {
      if (category.tvReachValues.length > 0) {
        category.avgTvReach = category.tvReachValues.reduce((sum: number, val: any) => sum + val.current, 0) / category.tvReachValues.length;
        category.avgTvIdeal = category.tvReachValues.reduce((sum: number, val: any) => sum + val.ideal, 0) / category.tvReachValues.length;
        category.tvGap = category.tvGapValues.reduce((sum: number, val: number) => sum + val, 0) / category.tvGapValues.length;
      }

      if (category.digitalReachValues.length > 0) {
        category.avgDigitalReach = category.digitalReachValues.reduce((sum: number, val: any) => sum + val.current, 0) / category.digitalReachValues.length;
        category.avgDigitalIdeal = category.digitalReachValues.reduce((sum: number, val: any) => sum + val.ideal, 0) / category.digitalReachValues.length;
        category.digitalGap = category.digitalGapValues.reduce((sum: number, val: number) => sum + val, 0) / category.digitalGapValues.length;
      }

      if (category.combinedReachValues.length > 0) {
        category.avgCombinedReach = category.combinedReachValues.reduce((sum: number, val: any) => sum + val.current, 0) / category.combinedReachValues.length;
        category.avgCombinedIdeal = category.combinedReachValues.reduce((sum: number, val: any) => sum + val.ideal, 0) / category.combinedReachValues.length;
        category.combinedGap = category.combinedGapValues.reduce((sum: number, val: number) => sum + val, 0) / category.combinedGapValues.length;
      }

      // Clean up temporary arrays
      delete category.tvReachValues;
      delete category.digitalReachValues;
      delete category.combinedReachValues;
      delete category.tvGapValues;
      delete category.digitalGapValues;
      delete category.combinedGapValues;
    });

    processedData.categoryReachAnalysis = Object.values(categoriesMap);

    return NextResponse.json(processedData);

  } catch (error) {
    console.error('Error fetching media sufficiency reach data:', error);
    
    // Return empty structure on error
    return NextResponse.json({
      summary: {
        totalRecords: 0,
        countries: 0,
        campaigns: 0,
        totalWoa: 0,
        totalWoff: 0,
        totalWeeks: 0
      },
      tvReachData: [],
      digitalReachData: [],
      combinedReachData: [],
      countryReachAnalysis: [],
      categoryReachAnalysis: []
    });
  }
}