import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/brands - Get all brands
export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
