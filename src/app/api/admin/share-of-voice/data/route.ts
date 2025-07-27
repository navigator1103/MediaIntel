import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const businessUnitId = searchParams.get('businessUnitId');

    if (!countryId || !businessUnitId) {
      return NextResponse.json({ error: 'Country ID and Business Unit ID are required' }, { status: 400 });
    }

    console.log(`=== LOADING SOV DATA API ===`);
    console.log(`Country ID: ${countryId}, Business Unit ID: ${businessUnitId}`);

    // Load existing SOV data for this country/business unit combination
    const sovData = await prisma.shareOfVoice.findMany({
      where: {
        countryId: parseInt(countryId),
        businessUnitId: parseInt(businessUnitId)
      },
      select: {
        id: true,
        category: true,
        company: true,
        totalTvInvestment: true,
        totalTvTrps: true,
        totalDigitalSpend: true,
        totalDigitalImpressions: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { category: 'asc' },
        { position: 'asc' } // Order by position to preserve competitor order
      ]
    });

    console.log(`Found ${sovData.length} SOV records in database:`);
    sovData.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.category} - ${record.company} (TV: ${record.totalTvInvestment}/${record.totalTvTrps}, Digital: ${record.totalDigitalSpend}/${record.totalDigitalImpressions})`);
    });

    return NextResponse.json(sovData);

  } catch (error: any) {
    console.error('Error loading SOV data:', error);
    return NextResponse.json({
      error: 'Failed to load SOV data',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}