import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, filterCountriesByAccess } from '@/lib/auth/countryAccess';

// GET - List countries based on user access
export async function GET(request: NextRequest) {
  try {
    // Get user access information for country filtering
    const userAccess = await getUserFromRequest(request);
    
    // Get accessible countries for the user
    const countries = userAccess 
      ? await filterCountriesByAccess(userAccess)
      : await prisma.country.findMany({
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
      { 
        error: 'Failed to fetch countries', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}