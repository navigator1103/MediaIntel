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

    const audiences = await prisma.digitalTargetAudience.findMany({
      where: {
        countryId,
        businessUnitId
      }
    });

    return NextResponse.json(audiences);
  } catch (error: any) {
    console.error('Error fetching Digital target audiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch target audiences', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { countryId, businessUnitId, audiences, uploadedBy = 'admin' } = await request.json();

    if (!countryId || !businessUnitId || !audiences || !Array.isArray(audiences)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Clear existing target audiences for this country/business unit
    await prisma.digitalTargetAudience.deleteMany({
      where: {
        countryId,
        businessUnitId
      }
    });

    // Create new target audiences
    const createdAudiences = await Promise.all(
      audiences.map(audience =>
        prisma.digitalTargetAudience.create({
          data: {
            countryId,
            businessUnitId,
            gender: audience.gender,
            minAge: audience.minAge,
            maxAge: audience.maxAge,
            sel: audience.sel || null,
            finalTarget: audience.finalTarget,
            saturationPoint: audience.saturationPoint || 0,
            saturationTrp: audience.saturationTrp || null,
            uploadedBy
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${createdAudiences.length} target audiences`,
      audiences: createdAudiences
    });

  } catch (error: any) {
    console.error('Error saving Digital target audiences:', error);
    return NextResponse.json(
      { error: 'Failed to save target audiences', details: error.message },
      { status: 500 }
    );
  }
}