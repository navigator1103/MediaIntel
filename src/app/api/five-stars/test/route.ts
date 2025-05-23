import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const criteriaCount = await prisma.fiveStarsCriterion.count();
    const ratingsCount = await prisma.fiveStarsRating.count();
    
    // Get sample data
    const sampleCriteria = await prisma.fiveStarsCriterion.findMany({
      take: 2,
    });
    
    const sampleRatings = await prisma.fiveStarsRating.findMany({
      take: 2,
      include: {
        country: true,
        brand: true,
        criterion: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        criteria: criteriaCount,
        ratings: ratingsCount,
      },
      sampleData: {
        criteria: sampleCriteria,
        ratings: sampleRatings,
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
