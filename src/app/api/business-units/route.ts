import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all business units with their categories
export async function GET(request: NextRequest) {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      select: {
        id: true,
        name: true,
        categories: {
          select: {
            id: true,
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch business units', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}