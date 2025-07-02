import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all MediaSufficiency records with their reach data
    const mediaSufficiencyData = await prisma.mediaSufficiency.findMany({
      select: {
        id: true,
        lastUpdate: true,
        country: true,
        category: true,
        range: true,
        campaign: true,
        tvR1Plus: true,
        tvR3Plus: true,
        tvIdealReach: true,
        tvTargetSize: true,
        woaOpenTv: true,
        woaPaidTv: true,
        digitalR1Plus: true,
        digitalIdealReach: true,
        digitalTargetSize: true,
        woaPmFf: true,
        woaInfluencersAmplification: true,
        plannedCombinedReach: true,
        combinedIdealReach: true,
        totalCountryPopulationOnTarget: true,
        digitalReachLevelCheck: true,
        tvReachLevelCheck: true,
        combinedReachLevelCheck: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process data for charts
    const processedData = {
      // Summary stats
      summary: {
        totalRecords: mediaSufficiencyData.length,
        countries: [...new Set(mediaSufficiencyData.map(d => d.country).filter(Boolean))].length,
        campaigns: [...new Set(mediaSufficiencyData.map(d => d.campaign).filter(Boolean))].length,
        lastUpdated: mediaSufficiencyData[0]?.createdAt || null,
        woaOpenTv: mediaSufficiencyData.reduce((sum, d) => sum + (d.woaOpenTv || 0), 0),
        woaPaidTv: mediaSufficiencyData.reduce((sum, d) => sum + (d.woaPaidTv || 0), 0),
        woaPmFf: mediaSufficiencyData.reduce((sum, d) => sum + (d.woaPmFf || 0), 0),
        woaInfluencersAmplification: mediaSufficiencyData.reduce((sum, d) => sum + (d.woaInfluencersAmplification || 0), 0)
      },

      // TV Reach data for charts with calculated fields
      tvReachData: (() => {
        // Group by campaign to calculate sums
        const campaignGroups: Record<string, any[]> = {};
        mediaSufficiencyData
          .filter(d => d.tvR1Plus && d.tvIdealReach)
          .forEach(d => {
            const campaign = d.campaign || 'Unknown';
            if (!campaignGroups[campaign]) {
              campaignGroups[campaign] = [];
            }
            campaignGroups[campaign].push(d);
          });

        // Calculate for each campaign
        return Object.entries(campaignGroups).map(([campaign, records]) => {
          // Sum of TV R1+ (convert % to decimal for calculation)
          const sumTvR1Plus = records.reduce((sum, d) => {
            return sum + (parseFloat(d.tvR1Plus?.replace('%', '') || '0') / 100);
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

          // Average ideal reach for this campaign
          const avgIdealReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.tvIdealReach?.replace('%', '') || '0');
          }, 0) / records.length;

          // Current reach as percentage for chart display
          const avgCurrentReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.tvR1Plus?.replace('%', '') || '0');
          }, 0) / records.length;

          return {
            campaign,
            country: records[0]?.country || 'Unknown',
            category: records[0]?.category || 'Unknown',
            currentReach: avgCurrentReach, // For chart display
            idealReach: avgIdealReach, // For chart display
            gap: parseFloat(records[0]?.tvReachLevelCheck?.replace('%', '') || '0'),
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
          .filter(d => d.digitalR1Plus && d.digitalIdealReach)
          .forEach(d => {
            const campaign = d.campaign || 'Unknown';
            if (!campaignGroups[campaign]) {
              campaignGroups[campaign] = [];
            }
            campaignGroups[campaign].push(d);
          });

        // Calculate for each campaign
        return Object.entries(campaignGroups).map(([campaign, records]) => {
          // Sum of Digital R1+ (convert % to decimal for calculation)
          const sumDigitalR1Plus = records.reduce((sum, d) => {
            return sum + (parseFloat(d.digitalR1Plus?.replace('%', '') || '0') / 100);
          }, 0);

          // Sum of Digital Target Size (convert to numbers)
          const sumDigitalTargetSize = records.reduce((sum, d) => {
            const targetSizeStr = d.digitalTargetSize || '0';
            const targetSizeNum = parseFloat(targetSizeStr.replace(/[,%]/g, '') || '0');
            return sum + targetSizeNum;
          }, 0);

          // Calculate Reach Abs = Sum(Digital R1+) × sum(Digital Target Size)
          const reachAbs = sumDigitalR1Plus * sumDigitalTargetSize;

          // Potential = sum(Digital Target Size)
          const potential = sumDigitalTargetSize;

          // Average ideal reach for this campaign
          const avgIdealReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.digitalIdealReach?.replace('%', '') || '0');
          }, 0) / records.length;

          // Current reach as percentage for chart display
          const avgCurrentReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.digitalR1Plus?.replace('%', '') || '0');
          }, 0) / records.length;

          return {
            campaign,
            country: records[0]?.country || 'Unknown',
            category: records[0]?.category || 'Unknown',
            currentReach: avgCurrentReach, // For chart display
            idealReach: avgIdealReach, // For chart display
            gap: parseFloat(records[0]?.digitalReachLevelCheck?.replace('%', '') || '0'),
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
          .filter(d => d.plannedCombinedReach && d.combinedIdealReach)
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

          // Sum of Total Country Population on Target (convert to numbers)
          const sumTotalCountryPopulation = records.reduce((sum, d) => {
            const populationStr = d.totalCountryPopulationOnTarget || '0';
            const populationNum = parseFloat(populationStr.replace(/[,%]/g, '') || '0');
            return sum + populationNum;
          }, 0);

          // Calculate Reach Abs = sum(Planned Combined Reach) × sum(Total Country Population on Target)
          const reachAbs = sumPlannedCombinedReach * sumTotalCountryPopulation;

          // Potential = sum(Total Country Population on Target)
          const potential = sumTotalCountryPopulation;

          // Average ideal reach for this campaign
          const avgIdealReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.combinedIdealReach?.replace('%', '') || '0');
          }, 0) / records.length;

          // Current reach as percentage for chart display
          const avgCurrentReach = records.reduce((sum, d) => {
            return sum + parseFloat(d.plannedCombinedReach?.replace('%', '') || '0');
          }, 0) / records.length;

          return {
            campaign,
            country: records[0]?.country || 'Unknown',
            category: records[0]?.category || 'Unknown',
            currentReach: avgCurrentReach, // For chart display
            idealReach: avgIdealReach, // For chart display
            gap: parseFloat(records[0]?.combinedReachLevelCheck?.replace('%', '') || '0'),
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
      if (d.tvR1Plus && d.tvIdealReach) {
        const current = parseFloat(d.tvR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.tvIdealReach.replace('%', '') || '0');
        const gap = parseFloat(d.tvReachLevelCheck?.replace('%', '') || '0');
        
        countriesMap[d.country].tvReachValues.push({ current, ideal });
        countriesMap[d.country].tvGapValues.push(gap);
      }

      // Digital Reach
      if (d.digitalR1Plus && d.digitalIdealReach) {
        const current = parseFloat(d.digitalR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.digitalIdealReach.replace('%', '') || '0');
        const gap = parseFloat(d.digitalReachLevelCheck?.replace('%', '') || '0');
        
        countriesMap[d.country].digitalReachValues.push({ current, ideal });
        countriesMap[d.country].digitalGapValues.push(gap);
      }

      // Combined Reach
      if (d.plannedCombinedReach && d.combinedIdealReach) {
        const current = parseFloat(d.plannedCombinedReach.replace('%', '') || '0');
        const ideal = parseFloat(d.combinedIdealReach.replace('%', '') || '0');
        const gap = parseFloat(d.combinedReachLevelCheck?.replace('%', '') || '0');
        
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

      if (d.digitalR1Plus && d.digitalIdealReach) {
        const current = parseFloat(d.digitalR1Plus.replace('%', '') || '0');
        const ideal = parseFloat(d.digitalIdealReach.replace('%', '') || '0');
        const gap = parseFloat(d.digitalReachLevelCheck?.replace('%', '') || '0');
        
        categoriesMap[d.category].digitalReachValues.push({ current, ideal });
        categoriesMap[d.category].digitalGapValues.push(gap);
      }

      if (d.plannedCombinedReach && d.combinedIdealReach) {
        const current = parseFloat(d.plannedCombinedReach.replace('%', '') || '0');
        const ideal = parseFloat(d.combinedIdealReach.replace('%', '') || '0');
        const gap = parseFloat(d.combinedReachLevelCheck?.replace('%', '') || '0');
        
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
    return NextResponse.json(
      { error: 'Failed to fetch media sufficiency reach data' },
      { status: 500 }
    );
  }
}