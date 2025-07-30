import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List countries for authentication/signup (simplified)
export async function GET(request: NextRequest) {
  try {
    console.log('Countries API called');
    
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${countries.length} countries`);
    
    // Add CORS headers for broader browser compatibility
    const response = NextResponse.json(countries);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error fetching countries for auth:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch countries', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}