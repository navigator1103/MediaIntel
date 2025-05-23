import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Log the Prisma client status
console.log('Media Sufficiency API route loaded, Prisma client status:', prisma ? 'Initialized' : 'Not initialized');

export async function GET(request: NextRequest) {
  try {
    console.log('Media Sufficiency API called');
    
    // Verify Prisma connection
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as result`;
      console.log('Database connection test:', connectionTest);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || '2025';
    const country = searchParams.get('country') || 'all';
    const subRegion = searchParams.get('subRegion') || 'all';
    const category = searchParams.get('category') || 'all';

    // Build filter conditions
    const whereClause: any = {
      year: parseInt(year),
    };

    if (country !== 'all') {
      whereClause.country = {
        name: country,
      };
    }

    if (subRegion !== 'all') {
      whereClause.country = {
        ...whereClause.country,
        subRegion: {
          name: subRegion,
        },
      };
    }

    if (category !== 'all') {
      // Fix: Use proper Prisma nested filtering for category
      whereClause.range = {
        categoryId: {
          in: await prisma.category.findMany({
            where: { name: category },
            select: { id: true }
          }).then(categories => categories.map(c => c.id))
        }
      };
    }

    console.log('Fetching campaigns with filter:', JSON.stringify(whereClause, null, 2));
    console.log('Year parameter type:', typeof year, 'value:', year);
    // Fetch campaigns with their media items
    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        // Use a simpler approach to include range
        range: true,
        // We'll handle the category relationship in the processing function
        country: {
          include: {
            subRegion: true,
          },
        },
        mediaItems: {
          include: {
            mediaSubtype: {
              include: {
                mediaType: true,
              },
            },
          },
        },
      },
    });

    // Fetch distinct categories
    let categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    // Standardize category names (normalize case differences)
    // Create a map to track categories by their lowercase name
    const categoryMap = new Map<string, {id: number, name: string}[]>();
    
    // Group categories by lowercase name
    categories.forEach(category => {
      const lowerName = category.name.toLowerCase();
      if (!categoryMap.has(lowerName)) {
        categoryMap.set(lowerName, []);
      }
      categoryMap.get(lowerName)?.push(category);
    });
    
    // Filter out duplicates and standardize case formatting for all categories
    // For consistency, we'll use ALL UPPERCASE for short categories (3 letters or less) like "DEO"
    // and Title Case for longer categories like "Body Care"
    categories = Array.from(categoryMap.entries()).map(([lowerName, cats]) => {
      // If there are multiple categories with the same name (case-insensitive)
      if (cats.length > 1) {
        console.log(`Found duplicate category: ${lowerName} with ${cats.length} variations`);
        
        // Determine the preferred case format based on name length
        let preferredFormat;
        if (lowerName.length <= 3) {
          // Short names (like DEO) should be ALL UPPERCASE
          preferredFormat = lowerName.toUpperCase();
        } else {
          // Longer names should be Title Case (each word capitalized)
          preferredFormat = lowerName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        // Try to find a category with the preferred format
        const preferredCat = cats.find(c => c.name === preferredFormat);
        
        // If we found a category with the preferred format, use it
        // Otherwise, create a new standardized version using the first category's ID
        if (preferredCat) {
          return preferredCat;
        } else {
          // Return the first category but with the name standardized
          return {
            id: cats[0].id,
            name: preferredFormat
          };
        }
      }
      
      // For single categories, also standardize the name format
      const cat = cats[0];
      if (lowerName.length <= 3) {
        // Short names should be ALL UPPERCASE
        return {
          id: cat.id,
          name: lowerName.toUpperCase()
        };
      } else {
        // Longer names should be Title Case
        return {
          id: cat.id,
          name: lowerName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        };
      }
    });

    // Fetch distinct sub-regions and standardize names
    let subRegions = await prisma.subRegion.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    // Standardize sub-region names (normalize case differences)
    const subRegionMap = new Map<string, {id: number, name: string}[]>();
    
    // Group sub-regions by lowercase name
    subRegions.forEach(sr => {
      const lowerName = sr.name.toLowerCase();
      if (!subRegionMap.has(lowerName)) {
        subRegionMap.set(lowerName, []);
      }
      subRegionMap.get(lowerName)?.push(sr);
    });
    
    // Filter out duplicates and standardize names
    subRegions = Array.from(subRegionMap.entries()).map(([lowerName, srs]) => {
      // If there are multiple sub-regions with the same name (case-insensitive)
      if (srs.length > 1) {
        console.log(`Found duplicate sub-region: ${lowerName} with ${srs.length} variations`);
        // Prefer all uppercase for sub-regions
        const upperCase = lowerName.toUpperCase();
        const upperCaseSr = srs.find(s => s.name === upperCase);
        return upperCaseSr || srs[0];
      }
      return srs[0];
    });
    
    // Filter out European sub-regions
    const europeanSubRegionNames = ['Europe', 'EUROPE', 'europe'];
    subRegions = subRegions.filter(sr => !europeanSubRegionNames.includes(sr.name));
    
    // Get IDs of European sub-regions to filter out countries
    const europeanSubRegionIds = await prisma.subRegion.findMany({
      where: {
        name: {
          in: europeanSubRegionNames
        }
      },
      select: {
        id: true
      }
    });
    const europeanSubRegionIdList = europeanSubRegionIds.map(sr => sr.id);
    
    // Fetch distinct countries, excluding European ones
    const countries = await prisma.mSCountry.findMany({
      where: {
        subRegionId: {
          notIn: europeanSubRegionIdList
        }
      },
      select: {
        id: true,
        name: true,
        subRegionId: true,
        subRegion: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch distinct media types
    const mediaTypes = await prisma.mediaType.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Fetch distinct business units (brands)
    let businessUnits = await prisma.businessUnit.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    // Standardize business unit names (normalize case differences)
    // Create a map to track business units by their lowercase name
    const businessUnitMap = new Map<string, {id: number, name: string}[]>();
    
    // Group business units by lowercase name
    businessUnits.forEach(bu => {
      const lowerName = bu.name.toLowerCase();
      if (!businessUnitMap.has(lowerName)) {
        businessUnitMap.set(lowerName, []);
      }
      businessUnitMap.get(lowerName)?.push(bu);
    });
    
    // Filter out duplicates, keeping only one business unit per lowercase name
    // Prefer the version with proper case (first letter uppercase, rest lowercase)
    businessUnits = Array.from(businessUnitMap.entries()).map(([lowerName, bus]) => {
      // If there are multiple business units with the same name (case-insensitive)
      if (bus.length > 1) {
        console.log(`Found duplicate business unit: ${lowerName} with ${bus.length} variations`);
        // Try to find the properly cased version (first letter uppercase, rest lowercase)
        const properCase = lowerName.charAt(0).toUpperCase() + lowerName.slice(1).toLowerCase();
        const properCaseBu = bus.find(b => b.name === properCase);
        // Return the properly cased version if found, otherwise the first one
        return properCaseBu || bus[0];
      }
      return bus[0];
    });

    // Process data for dashboard visualizations
    const processedData = processDataForDashboard(campaigns);
    
    console.log(`Found ${campaigns.length} campaigns for year ${year}`);
    if (campaigns.length > 0) {
      console.log('Sample campaign:', JSON.stringify(campaigns[0], null, 2).substring(0, 300) + '...');
    } else {
      console.log('No campaigns found. Checking available years in database...');
      const availableYears = await prisma.campaign.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' }
      });
      console.log('Available years in database:', availableYears);
    }

    console.log('API response data:', {
      campaignsCount: campaigns.length,
      categoriesCount: categories.length,
      countriesCount: countries.length,
      subRegionsCount: subRegions.length,
      mediaTypesCount: mediaTypes.length,
    });
    
    return NextResponse.json({
      campaigns,
      categories,
      countries,
      subRegions,
      mediaTypes,
      businessUnits,
      dashboardData: processedData,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    console.error('Error fetching media sufficiency data:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch media sufficiency data', 
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : 'No stack trace') : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to process campaign data for dashboard visualizations
function processDataForDashboard(campaigns: any[]) {
  // Calculate total budget
  const totalBudget = campaigns.reduce((sum, campaign) => {
    const campaignBudget = campaign.mediaItems.reduce(
      (itemSum: number, item: any) => itemSum + (item.totalBudget || 0),
      0
    );
    return sum + campaignBudget;
  }, 0);

  // Calculate media share by type
  const mediaShareByType = new Map();
  campaigns.forEach(campaign => {
    if (!campaign.mediaItems) return;
    
    campaign.mediaItems.forEach((item: any) => {
      // Handle potential undefined values
      let mediaTypeName = 'Unknown';
      try {
        if (item.mediaSubtype && item.mediaSubtype.mediaType) {
          mediaTypeName = item.mediaSubtype.mediaType.name;
        }
      } catch (e) {
        console.log('Error getting media type name for item in campaign:', campaign.id);
      }
      
      const currentValue = mediaShareByType.get(mediaTypeName) || 0;
      mediaShareByType.set(mediaTypeName, currentValue + (item.totalBudget || 0));
    });
  });

  const mediaShareData = Array.from(mediaShareByType.entries()).map(([name, value]) => ({
    name,
    value: (value as number / totalBudget) * 100,
    color: getMediaTypeColor(name),
  }));

  // Calculate campaign distribution by category
  const campaignDistribution = new Map();
  campaigns.forEach(campaign => {
    // Get category from range using the categories relationship
    // For now, use a placeholder if category is not available
    let categoryName = 'Unknown';
    try {
      // If the category is directly available, use it
      if (campaign.range && campaign.range.category) {
        categoryName = campaign.range.category.name;
      }
    } catch (e) {
      console.log('Error getting category name for campaign:', campaign.id);
    }
    
    const campaignBudget = campaign.mediaItems.reduce(
      (sum: number, item: any) => sum + (item.totalBudget || 0),
      0
    );
    
    const currentValue = campaignDistribution.get(categoryName) || 0;
    campaignDistribution.set(categoryName, currentValue + campaignBudget);
  });

  const campaignDistributionData = Array.from(campaignDistribution.entries()).map(([name, value]) => ({
    name,
    value: (value as number / totalBudget) * 100,
    color: getCategoryColor(name),
  }));

  // Calculate quarterly distribution
  const quarterlyData = [
    { quarter: 'Q1', value: 0 },
    { quarter: 'Q2', value: 0 },
    { quarter: 'Q3', value: 0 },
    { quarter: 'Q4', value: 0 },
  ];

  campaigns.forEach(campaign => {
    campaign.mediaItems.forEach((item: any) => {
      if (item.q1Budget) quarterlyData[0].value += item.q1Budget;
      if (item.q2Budget) quarterlyData[1].value += item.q2Budget;
      if (item.q3Budget) quarterlyData[2].value += item.q3Budget;
      if (item.q4Budget) quarterlyData[3].value += item.q4Budget;
    });
  });

  // Return processed data
  return {
    totalBudget,
    mediaShareData,
    campaignDistributionData,
    quarterlyData,
    totalCampaigns: campaigns.length,
  };
}

// Helper function to get consistent colors for media types
function getMediaTypeColor(mediaType: string): string {
  const colorMap: Record<string, string> = {
    'TV': '#8884d8',
    'Digital': '#82ca9d',
    'OOH': '#ffc658',
    'Radio': '#ff8042',
    'Print': '#0088fe',
    'Cinema': '#00C49F',
  };

  return colorMap[mediaType] || '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// Helper function to get consistent colors for categories
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Deo': '#8884d8',
    'Face Care': '#82ca9d',
    'Hand Body': '#ffc658',
    'Lip': '#ff8042',
    'Men': '#0088fe',
    'Sun': '#00C49F',
  };

  return colorMap[category] || '#' + Math.floor(Math.random() * 16777215).toString(16);
}
