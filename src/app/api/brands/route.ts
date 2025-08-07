import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all brands
export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch brands', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}