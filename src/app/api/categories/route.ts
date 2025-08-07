import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        ranges: {
          select: {
            range: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format the response to include ranges
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      ranges: category.ranges.map(ctr => ctr.range)
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}