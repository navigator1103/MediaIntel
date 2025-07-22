import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const STANDARD_BUDGETS = [
  50000, 75000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000,
  750000, 900000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = parseInt(searchParams.get('countryId') || '0');
    const businessUnitId = parseInt(searchParams.get('businessUnitId') || '0');

    if (!countryId || !businessUnitId) {
      return NextResponse.json({ error: 'Country ID and Business Unit ID are required' }, { status: 400 });
    }

    // Get all digital diminishing returns data for this country/business unit
    const digitalData = await prisma.digitalDiminishingReturns.findMany({
      where: {
        countryId,
        businessUnitId
      },
      orderBy: [
        { budget: 'asc' },
        { targetAudience: 'asc' }
      ]
    });

    // Transform the data to match the expected curves format
    // Group by budget and organize by target audience
    const curvesMap = new Map();
    
    // Initialize with standard budgets
    STANDARD_BUDGETS.forEach(budget => {
      curvesMap.set(budget, {
        budget,
        frequency: null,
        audience1Reach: null,
        audience2Reach: null,
        audience3Reach: null,
        audience4Reach: null,
        audience5Reach: null
      });
    });

    // Get unique target audiences to determine audience order
    const uniqueAudiences = Array.from(new Set(digitalData.map(item => item.targetAudience)));
    
    // Fill in the actual data
    digitalData.forEach(item => {
      if (curvesMap.has(item.budget)) {
        const curve = curvesMap.get(item.budget);
        const audienceIndex = uniqueAudiences.indexOf(item.targetAudience) + 1;
        
        // Set frequency once per budget level (same for all audiences)
        if (curve.frequency === null) {
          curve.frequency = item.frequency;
        }
        
        // Set reach per audience
        if (audienceIndex >= 1 && audienceIndex <= 5) {
          curve[`audience${audienceIndex}Reach`] = item.reach;
        }
      }
    });

    // Convert map to array
    const curves = Array.from(curvesMap.values());

    return NextResponse.json(curves);
  } catch (error: any) {
    console.error('Error fetching Digital curves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curves', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Digital curves POST route called');
    
    const { countryId, businessUnitId, curves, uploadedBy = 'admin' } = await request.json();

    if (!countryId || !businessUnitId || !curves || !Array.isArray(curves)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    console.log('Processing digital curves save request...');

    // Get existing audience data to preserve audience demographics
    const existingAudiences = await prisma.digitalDiminishingReturns.findMany({
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

    // Create a map of audience demographics
    const audienceMap = new Map();
    existingAudiences.forEach(aud => {
      audienceMap.set(aud.targetAudience, {
        gender: aud.gender,
        minAge: aud.minAge,
        maxAge: aud.maxAge,
        saturationPoint: aud.saturationPoint
      });
    });

    // Clear existing curves data
    const deleteResult = await prisma.digitalDiminishingReturns.deleteMany({
      where: {
        countryId,
        businessUnitId
      }
    });
    console.log('Existing digital curves cleared, deleted:', deleteResult.count);

    // Get unique audiences from the curves data (determine which audiences are active)
    const activeAudiences = [];
    for (let i = 1; i <= 5; i++) {
      const hasData = curves.some(curve => 
        curve[`audience${i}Reach`] != null && curve[`audience${i}Reach`] > 0
      );
      if (hasData) {
        activeAudiences.push(i);
      }
    }

    // Create new curve records for each budget/audience combination
    const createPromises = [];
    
    curves.forEach(curve => {
      activeAudiences.forEach(audienceIndex => {
        const reach = curve[`audience${audienceIndex}Reach`];
        
        // Only create records where we have actual reach data
        if (reach != null && reach > 0) {
          // Generate target audience name if not found in existing data
          const targetAudience = `Audience ${audienceIndex}`;
          const audienceInfo = audienceMap.get(targetAudience) || {
            gender: 'F',
            minAge: 18,
            maxAge: 45,
            saturationPoint: 0
          };

          createPromises.push(
            prisma.digitalDiminishingReturns.create({
              data: {
                countryId,
                businessUnitId,
                targetAudience,
                gender: audienceInfo.gender,
                minAge: audienceInfo.minAge,
                maxAge: audienceInfo.maxAge,
                saturationPoint: audienceInfo.saturationPoint,
                budget: curve.budget,
                frequency: curve.frequency || 0, // Single frequency per budget level
                reach: reach,
                uploadedBy
              }
            })
          );
        }
      });
    });

    if (createPromises.length > 0) {
      const createdCurves = await Promise.all(createPromises);
      console.log(`Created ${createdCurves.length} digital curve points`);

      return NextResponse.json({
        success: true,
        message: `Successfully saved ${createdCurves.length} curve points`,
        curves: createdCurves.length
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No curve data to save',
        curves: 0
      });
    }

  } catch (error: any) {
    console.error('Error saving Digital curves:', error);
    return NextResponse.json(
      { error: 'Failed to save curves', details: error.message },
      { status: 500 }
    );
  }
}