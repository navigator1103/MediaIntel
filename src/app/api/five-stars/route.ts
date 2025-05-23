import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Log the Prisma client status
console.log('API route loaded, Prisma client status:', prisma ? 'Initialized' : 'Not initialized');

// Helper function to get five stars data
async function getFiveStarsData(month: string, brandId?: number, countryId?: number) {
  try {
    console.log('Starting getFiveStarsData with params:', { month, brandId, countryId });
    console.log('Prisma client instance:', prisma ? 'Available' : 'Not available');
    
    // Verify Prisma connection
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as result`;
      console.log('Database connection test:', connectionTest);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
    }
    console.log('Attempting to fetch criteria...');
    // Fetch criteria
    const criteria = await prisma.fiveStarsCriterion.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    console.log('Successfully fetched criteria:', criteria.length);
    
    console.log('Attempting to fetch countries from database...');
    // Fetch countries from the database
    const countriesFilter: any = {};
    if (countryId) {
      countriesFilter.id = countryId;
    }
    
    // Get countries from the database
    const dbCountries = await prisma.country.findMany({
      where: countriesFilter,
      orderBy: {
        name: 'asc'
      }
    });
    
    // Map to the expected format
    const countries = dbCountries.map(country => ({
      id: country.id,
      name: country.name,
      regionId: country.regionId
    }));

    console.log('Successfully fetched countries:', countries.length);
    
    console.log('Attempting to fetch ratings...');
    // Fetch ratings for the selected month, brand, and countries
    const ratings = await prisma.fiveStarsRating.findMany({
      where: {
        month,
        ...(brandId && { brandId }),
        ...(countryId && { countryId }),
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        criterion: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    console.log('Successfully fetched ratings:', ratings.length);
    
    console.log('Formatting data for frontend...');
    // Format the data for the frontend
    const formattedData = countries.map(country => {
      const countryRatings = ratings.filter(rating => rating.countryId === country.id);
      
      // Create a map of criterion ID to rating
      const ratingsMap: Record<number, number> = {};
      countryRatings.forEach(rating => {
        ratingsMap[rating.criterionId] = rating.rating;
      });

      return {
        id: country.id,
        name: country.name,
        ratings: ratingsMap,
      };
    });

    // Get brand information if brandId is provided
    let brandInfo = null;
    if (brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId }
      });
      
      if (brand) {
        brandInfo = {
          id: brand.id,
          name: brand.name
        };
      }
    }
    
    // Return with proper headers
    console.log('Successfully fetched data for:', { month, brandId, countryId });
    return NextResponse.json({
      criteria: criteria.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
      countries: formattedData,
      brand: brandInfo
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in getFiveStarsData:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch 5 Stars data', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Make sure this is a proper Next.js App Router API route
export async function GET(request: NextRequest) {
  try {
    console.log('GET request received');
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || '2025-03'; // Default to March 2025
    const brandId = searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined;
    const countryId = searchParams.get('countryId') ? parseInt(searchParams.get('countryId')!) : undefined;
    
    console.log('Processing GET request with params:', { month, brandId, countryId });
    return await getFiveStarsData(month, brandId, countryId);
  } catch (error) {
    console.error('Error in GET handler:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch 5 Stars data', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Add POST method to handle the new request format
export async function POST(request: NextRequest) {
  try {
    console.log('POST request received');
    // Parse request body
    const requestData = await request.json();
    const month = requestData.month || '2025-03'; // Default to March 2025
    const brandId = requestData.brandId ? Number(requestData.brandId) : undefined;
    const countryId = requestData.countryId ? Number(requestData.countryId) : undefined;
    
    console.log('Processing POST request with data:', { month, brandId, countryId });
    return await getFiveStarsData(month, brandId, countryId);
  } catch (error) {
    console.error('Error in POST handler:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch 5 Stars data', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
