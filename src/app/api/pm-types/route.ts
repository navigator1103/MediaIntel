import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all PM types
export async function GET(request: NextRequest) {
  try {
    const pmTypes = await prisma.pMType.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(pmTypes);
  } catch (error) {
    console.error('Error fetching PM types:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch PM types', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}