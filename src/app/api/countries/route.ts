import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/countries - Get all countries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    
    // Build filter object based on query parameters
    const filter: any = {};
    if (regionId) filter.regionId = parseInt(regionId);
    
    const countries = await prisma.country.findMany({
      where: filter,
      include: {
        region: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
