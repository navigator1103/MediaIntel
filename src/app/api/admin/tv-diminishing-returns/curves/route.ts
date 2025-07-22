import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = parseInt(searchParams.get('countryId') || '0');
    const businessUnitId = parseInt(searchParams.get('businessUnitId') || '0');

    if (!countryId || !businessUnitId) {
      return NextResponse.json({ error: 'Country ID and Business Unit ID are required' }, { status: 400 });
    }

    const curves = await prisma.tvDiminishingReturns.findMany({
      where: {
        countryId,
        businessUnitId
      },
      orderBy: {
        trp: 'asc'
      }
    });

    return NextResponse.json(curves);
  } catch (error: any) {
    console.error('Error fetching TV curves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curves', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { countryId, businessUnitId, curves, uploadedBy = 'admin' } = await request.json();

    if (!countryId || !businessUnitId || !curves || !Array.isArray(curves)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Clear existing curves for this country/business unit
    await prisma.tvDiminishingReturns.deleteMany({
      where: {
        countryId,
        businessUnitId
      }
    });

    // Create new curves
    const createdCurves = await Promise.all(
      curves.map(curve =>
        prisma.tvDiminishingReturns.create({
          data: {
            countryId,
            businessUnitId,
            trp: curve.trp,
            audience1Reach: curve.audience1Reach,
            audience2Reach: curve.audience2Reach,
            audience3Reach: curve.audience3Reach,
            audience4Reach: curve.audience4Reach,
            audience5Reach: curve.audience5Reach,
            uploadedBy
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${createdCurves.length} curve points`,
      curves: createdCurves
    });

  } catch (error: any) {
    console.error('Error saving TV curves:', error);
    return NextResponse.json(
      { error: 'Failed to save curves', details: error.message },
      { status: 500 }
    );
  }
}