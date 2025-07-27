import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessUnitId = searchParams.get('businessUnitId');

    if (!businessUnitId) {
      return NextResponse.json({ error: 'Business unit ID is required' }, { status: 400 });
    }

    // Get business unit details
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: parseInt(businessUnitId) },
      include: {
        categories: {
          select: {
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!businessUnit) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    const categories = businessUnit.categories.map(cat => cat.name);

    return NextResponse.json({
      businessUnitName: businessUnit.name,
      categories
    });

  } catch (error: any) {
    console.error('Error loading categories:', error);
    return NextResponse.json({
      error: 'Failed to load categories',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}