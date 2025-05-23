import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Log the Prisma client status
console.log('Taxonomy API route loaded, Prisma client status:', prisma ? 'Initialized' : 'Not initialized');

// Helper function to get taxonomy scores data
async function getTaxonomyScoresData(month?: string, countryId?: number, brandId?: number, platform?: string) {
  try {
    console.log('Starting getTaxonomyScoresData with params:', { month, countryId, brandId, platform });
    console.log('Prisma client instance:', prisma ? 'Available' : 'Not available');
    
    // Verify Prisma connection
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as result`;
      console.log('Database connection test:', connectionTest);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
    }
    
    // Build filter object based on query parameters
    const filter: any = {};
    
    // Always include month filter - it's required
    if (month) {
      // Ensure exact match for the month string
      filter.month = {
        equals: month
      };
      console.log(`Adding month filter: ${month}`);
      console.log(`Month parameter type: ${typeof month}, value: ${month}`);
    } else {
      console.error('Month parameter is missing or invalid');
      return NextResponse.json(
        { error: 'Month parameter is required and must be in format YYYY-MM' },
        { status: 400 }
      );
    }
    
    if (countryId) {
      // Use explicit equality check for countryId as well
      filter.countryId = {
        equals: countryId
      };
      console.log(`Adding country filter: ${countryId}`);
    }
    
    if (brandId) {
      // Use explicit equality check instead of just setting the value
      // This handles the case where brandId is null in the database
      filter.brandId = {
        equals: brandId
      };
      console.log(`Adding brand filter: ${brandId}`);
    }
    
    if (platform) {
      // Use explicit equality check for platform as well
      filter.platform = {
        equals: platform
      };
      console.log(`Adding platform filter: ${platform}`);
    }
    
    console.log('Using filter criteria:', JSON.stringify(filter, null, 2));
    console.log('SQL filter that will be used:', filter);
    
    // Fetch taxonomy scores from database
    const taxonomyScores = await prisma.taxonomyScore.findMany({
      where: filter,
      include: {
        country: true,
        brand: true
      },
      orderBy: {
        month: 'desc'
      }
    });
    
    console.log(`Found ${taxonomyScores.length} taxonomy scores matching criteria`);
    
    // Return with proper headers to prevent caching
    return NextResponse.json(taxonomyScores, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in getTaxonomyScoresData:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch taxonomy scores', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/taxonomy - Get taxonomy scores with filtering options
export async function GET(request: NextRequest) {
  try {
    console.log('GET request received for taxonomy scores');
    const searchParams = request.nextUrl.searchParams;
    
    // Get month parameter - this is required for filtering
    const month = searchParams.get('month');
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      console.warn('No month parameter provided in request or invalid format');
      return NextResponse.json(
        { error: 'Month parameter is required and must be in format YYYY-MM' },
        { status: 400 }
      );
    }
    
    // Get filter parameters if provided
    const countryId = searchParams.get('countryId') ? parseInt(searchParams.get('countryId')!) : undefined;
    const brandId = searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined;
    const platform = searchParams.get('platform') || undefined;
    
    console.log('Processing GET request with params:', { month, countryId, brandId, platform });
    console.log('Month parameter type:', typeof month, 'value:', month);
    console.log('CountryId parameter type:', typeof countryId, 'value:', countryId);
    console.log('BrandId parameter type:', typeof brandId, 'value:', brandId);
    console.log('Platform parameter type:', typeof platform, 'value:', platform);
    
    return await getTaxonomyScoresData(month, countryId, brandId, platform);
  } catch (error) {
    console.error('Error in GET handler:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch taxonomy scores', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/taxonomy - Create or update a taxonomy score
export async function POST(request: NextRequest) {
  try {
    console.log('POST request received for taxonomy scores');
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['countryId', 'month', 'l1Score', 'l2Score', 'l3Score'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    console.log('Validating taxonomy score data:', body);
    
    // Convert string IDs to numbers if needed
    const data = {
      countryId: typeof body.countryId === 'string' ? parseInt(body.countryId) : body.countryId,
      month: body.month,
      l1Score: typeof body.l1Score === 'string' ? parseInt(body.l1Score) : body.l1Score,
      l2Score: typeof body.l2Score === 'string' ? parseInt(body.l2Score) : body.l2Score,
      l3Score: typeof body.l3Score === 'string' ? parseInt(body.l3Score) : body.l3Score,
      averageScore: Math.round((body.l1Score + body.l2Score + body.l3Score) / 3)
    };
    
    console.log('Processed data:', data);
    console.log('Checking if record already exists...');
    
    // Verify Prisma connection
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as result`;
      console.log('Database connection test:', connectionTest);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      throw dbError;
    }
    
    // Check if a record already exists for this country and month
    const existingScore = await prisma.taxonomyScore.findFirst({
      where: {
        countryId: data.countryId,
        month: data.month
      }
    });
    
    console.log('Existing score found:', existingScore ? 'Yes' : 'No');
    
    let taxonomyScore;
    
    // Verify the country exists
    console.log('Verifying country exists...');
    const country = await prisma.country.findUnique({
      where: { id: data.countryId }
    });
    
    if (!country) {
      console.error(`Country with ID ${data.countryId} not found`);
      return NextResponse.json(
        { error: `Country with ID ${data.countryId} not found` },
        { status: 404 }
      );
    }
    
    console.log('Country found:', country.name);
    
    if (existingScore) {
      console.log('Updating existing taxonomy score record...');
      // Update existing record
      taxonomyScore = await prisma.taxonomyScore.update({
        where: {
          id: existingScore.id
        },
        data: {
          l1Score: data.l1Score,
          l2Score: data.l2Score,
          l3Score: data.l3Score,
          averageScore: data.averageScore
        },
        include: {
          country: true
        }
      });
      console.log('Successfully updated taxonomy score');
    } else {
      console.log('Creating new taxonomy score record...');
      // Create new record
      taxonomyScore = await prisma.taxonomyScore.create({
        data,
        include: {
          country: true
        }
      });
      console.log('Successfully created new taxonomy score');
    }
    
    return NextResponse.json(taxonomyScore, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to create/update taxonomy score', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
