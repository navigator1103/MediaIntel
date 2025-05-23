import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/five-stars/ratings - Get ratings with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract filter parameters
    const month = body.month || new Date().toISOString().slice(0, 7);
    const countryId = body.countryId ? parseInt(body.countryId) : undefined;
    const brandId = body.brandId ? parseInt(body.brandId) : undefined;
    
    console.log('Fetching ratings with filters:', { month, countryId, brandId });
    
    // Build filter object
    const filter: any = { month };
    if (countryId) filter.countryId = countryId;
    if (brandId) filter.brandId = brandId;
    
    // Fetch ratings
    const ratings = await prisma.fiveStarsRating.findMany({
      where: filter,
      include: {
        criterion: true,
        country: true,
        brand: true
      },
      orderBy: [
        { countryId: 'asc' },
        { criterionId: 'asc' }
      ]
    });
    
    console.log(`Found ${ratings.length} ratings matching criteria`);
    
    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify({ ratings }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/five-stars/ratings - Create or update a rating
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['criterionId', 'countryId', 'brandId', 'rating', 'month'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate rating value
    const rating = parseInt(body.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Prepare data for upsert
    const data = {
      criterionId: parseInt(body.criterionId),
      countryId: parseInt(body.countryId),
      brandId: parseInt(body.brandId),
      rating: rating,
      month: body.month
    };
    
    let result;
    
    // If ID is provided, update that specific rating
    if (body.id) {
      // Update the specified rating
      result = await prisma.fiveStarsRating.update({
        where: { id: parseInt(body.id) },
        data: { rating: data.rating },
        include: {
          criterion: true,
          country: true,
          brand: true
        }
      });
    } else {
      // Check if the rating already exists
      const existingRating = await prisma.fiveStarsRating.findFirst({
        where: {
          criterionId: data.criterionId,
          countryId: data.countryId,
          brandId: data.brandId,
          month: data.month
        }
      });
      
      if (existingRating) {
        // Update existing rating
        result = await prisma.fiveStarsRating.update({
          where: { id: existingRating.id },
          data: { rating: data.rating },
          include: {
            criterion: true,
            country: true,
            brand: true
          }
        });
      } else {
        // Create new rating
        result = await prisma.fiveStarsRating.create({
          data,
          include: {
            criterion: true,
            country: true,
            brand: true
          }
        });
      }
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to save rating', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/five-stars/ratings - Delete a rating
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing rating ID' },
        { status: 400 }
      );
    }
    
    await prisma.fiveStarsRating.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
