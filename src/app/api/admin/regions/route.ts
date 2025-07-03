import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all regions, sub-regions, and clusters for dropdowns
export async function GET(request: NextRequest) {
  try {
    const [regions, subRegions, clusters] = await Promise.all([
      prisma.region.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.subRegion.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.cluster.findMany({
        orderBy: { name: 'asc' }
      })
    ]);

    return NextResponse.json({
      regions,
      subRegions,
      clusters
    });
  } catch (error) {
    console.error('Error fetching regions data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}