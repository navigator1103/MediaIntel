import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/scores/[id] - Get a single score by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid score ID' },
        { status: 400 }
      );
    }
    
    const scoreId = parseInt(id);
    console.log(`API: Fetching score with ID: ${scoreId}`);
    
    const score = await prisma.score.findUnique({
      where: { id: scoreId },
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    
    if (!score) {
      console.log(`API: Score with ID ${scoreId} not found`);
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }
    
    console.log(`API: Found score with ID ${scoreId}`);
    
    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify(score), {
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
    console.error('Error fetching score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
