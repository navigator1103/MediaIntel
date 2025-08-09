import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/getUserFromToken';

export async function GET(request: NextRequest) {
  try {
    // Get user from token for authentication
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    const ranges = await prisma.range.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(ranges);
  } catch (error) {
    console.error('Error fetching ranges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranges' },
      { status: 500 }
    );
  }
}