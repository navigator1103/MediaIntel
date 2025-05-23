import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/five-stars/criteria - Get all criteria
export async function GET(request: NextRequest) {
  try {
    const criteria = await prisma.fiveStarsCriterion.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    
    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify(criteria), {
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
    console.error('Error fetching criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criteria', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/five-stars/criteria - Create a new criterion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'description'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const criterion = await prisma.fiveStarsCriterion.create({
      data: {
        name: body.name,
        description: body.description,
      },
    });
    
    return NextResponse.json(criterion, { status: 201 });
  } catch (error) {
    console.error('Error creating criterion:', error);
    return NextResponse.json(
      { error: 'Failed to create criterion', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
