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

    const audiences = await prisma.tvTargetAudience.findMany({
      where: {
        countryId,
        businessUnitId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(audiences);
  } catch (error: any) {
    console.error('Error fetching TV target audiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch target audiences', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('TV audiences POST route called');
    
    const requestData = await request.json();
    console.log('Request data received:', requestData);
    
    const { countryId, businessUnitId, audiences, uploadedBy = 'admin' } = requestData;

    if (!countryId || !businessUnitId || !audiences || !Array.isArray(audiences)) {
      console.log('Invalid request data validation failed');
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('Prisma client type:', typeof prisma);
    console.log('Prisma client defined:', !!prisma);
    console.log('Prisma tvTargetAudience type:', typeof prisma?.tvTargetAudience);
    console.log('Prisma tvTargetAudience defined:', !!prisma?.tvTargetAudience);

    // Test a simple query first
    try {
      console.log('Testing Prisma connection...');
      const testCount = await prisma.tvTargetAudience.count();
      console.log('Prisma connection test successful, count:', testCount);
    } catch (testError) {
      console.error('Prisma connection test failed:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 });
    }

    // Clear existing audiences for this country/business unit
    console.log('Clearing existing audiences...');
    const deleteResult = await prisma.tvTargetAudience.deleteMany({
      where: {
        countryId,
        businessUnitId
      }
    });
    console.log('Existing audiences cleared, deleted:', deleteResult.count);

    // Create new audiences
    const createdAudiences = await Promise.all(
      audiences.map(audience =>
        prisma.tvTargetAudience.create({
          data: {
            countryId,
            businessUnitId,
            gender: audience.gender,
            minAge: audience.minAge,
            maxAge: audience.maxAge,
            sel: audience.sel,
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
    console.error('Error saving TV target audiences:', error);
    return NextResponse.json(
      { error: 'Failed to save target audiences', details: error.message },
      { status: 500 }
    );
  }
}