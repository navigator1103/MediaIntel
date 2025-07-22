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

    // Get distinct target audiences from digital diminishing returns data
    const digitalData = await prisma.digitalDiminishingReturns.findMany({
      where: {
        countryId,
        businessUnitId
      },
      select: {
        targetAudience: true,
        gender: true,
        minAge: true,
        maxAge: true,
        saturationPoint: true
      },
      distinct: ['targetAudience']
    });

    // Transform to match the expected audience format
    const audiences = digitalData.map(item => ({
      id: `${item.targetAudience}-${countryId}-${businessUnitId}`, // Generate consistent ID
      gender: item.gender,
      minAge: item.minAge,
      maxAge: item.maxAge,
      sel: '', // Extract SEL from targetAudience if present
      finalTarget: item.targetAudience,
      saturationPoint: item.saturationPoint
    }));

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
    console.log('Digital audiences POST route called');
    
    const requestData = await request.json();
    console.log('Request data received:', requestData);
    
    const { countryId, businessUnitId, audiences, uploadedBy = 'admin' } = requestData;

    if (!countryId || !businessUnitId || !audiences || !Array.isArray(audiences)) {
      console.log('Invalid request data validation failed');
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('Processing digital audiences save request...');

    // First, get existing digital data to preserve curve points
    const existingData = await prisma.digitalDiminishingReturns.findMany({
      where: {
        countryId,
        businessUnitId
      }
    });

    // Clear all existing digital data for this country/business unit
    const deleteResult = await prisma.digitalDiminishingReturns.deleteMany({
      where: {
        countryId,
        businessUnitId
      }
    });
    console.log('Existing digital data cleared, deleted:', deleteResult.count);

    // If there were existing curve points, recreate them with updated audience info
    if (existingData.length > 0) {
      // Group existing data by target audience and budget
      const existingCurveData = new Map();
      existingData.forEach(item => {
        const key = `${item.targetAudience}-${item.budget}`;
        existingCurveData.set(key, {
          budget: item.budget,
          frequency: item.frequency,
          reach: item.reach
        });
      });

      // Create records for each audience with their curve data
      const createPromises = [];
      
      for (const audience of audiences) {
        // Look for existing curve data for this audience
        const entries = Array.from(existingCurveData.entries());
        for (const [key, curveData] of entries) {
          const [targetAudience, budget] = key.split('-');
          if (targetAudience === audience.finalTarget) {
            createPromises.push(
              prisma.digitalDiminishingReturns.create({
                data: {
                  countryId,
                  businessUnitId,
                  targetAudience: audience.finalTarget,
                  gender: audience.gender,
                  minAge: audience.minAge,
                  maxAge: audience.maxAge,
                  saturationPoint: audience.saturationPoint || 0,
                  budget: curveData.budget,
                  frequency: curveData.frequency,
                  reach: curveData.reach,
                  uploadedBy
                }
              })
            );
          }
        }
      }

      if (createPromises.length > 0) {
        await Promise.all(createPromises);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${audiences.length} target audiences`,
      audiences: audiences
    });

  } catch (error: any) {
    console.error('Error saving Digital target audiences:', error);
    return NextResponse.json(
      { error: 'Failed to save target audiences', details: error.message },
      { status: 500 }
    );
  }
}