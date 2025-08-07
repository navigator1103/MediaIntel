import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all countries
export async function GET(request: NextRequest) {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        regionId: true,
        region: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch countries', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}