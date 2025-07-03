import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all countries
export async function GET(request: NextRequest) {
  try {
    const countries = await prisma.country.findMany({
      orderBy: [
        { name: 'asc' }
      ],
      include: {
        region: true,
        subRegion: true,
        cluster: true,
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const countriesData = countries.map(country => ({
      id: country.id,
      name: country.name,
      region: country.region?.name || null,
      regionId: country.regionId,
      subRegion: country.subRegion?.name || null,
      subRegionId: country.subRegionId,
      cluster: country.cluster?.name || null,
      clusterId: country.clusterId,
      createdAt: country.createdAt.toISOString(),
      updatedAt: country.updatedAt.toISOString(),
      gamePlansCount: country._count.gamePlans
    }));

    return NextResponse.json(countriesData);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new country
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, regionId, subRegionId, clusterId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingCountry = await prisma.country.findUnique({
      where: { name: name.trim() }
    });

    if (existingCountry) {
      return NextResponse.json(
        { error: 'A country with this name already exists' },
        { status: 409 }
      );
    }

    // Validate region, subRegion, and cluster if provided
    if (regionId) {
      const region = await prisma.region.findUnique({ where: { id: regionId } });
      if (!region) {
        return NextResponse.json(
          { error: 'Invalid region ID' },
          { status: 400 }
        );
      }
    }

    if (subRegionId) {
      const subRegion = await prisma.subRegion.findUnique({ where: { id: subRegionId } });
      if (!subRegion) {
        return NextResponse.json(
          { error: 'Invalid sub-region ID' },
          { status: 400 }
        );
      }
    }

    if (clusterId) {
      const cluster = await prisma.cluster.findUnique({ where: { id: clusterId } });
      if (!cluster) {
        return NextResponse.json(
          { error: 'Invalid cluster ID' },
          { status: 400 }
        );
      }
    }

    const newCountry = await prisma.country.create({
      data: {
        name: name.trim(),
        regionId: regionId || null,
        subRegionId: subRegionId || null,
        clusterId: clusterId || null
      },
      include: {
        region: true,
        subRegion: true,
        cluster: true
      }
    });

    // Transform to match the expected interface
    const countryData = {
      id: newCountry.id,
      name: newCountry.name,
      region: newCountry.region?.name || null,
      regionId: newCountry.regionId,
      subRegion: newCountry.subRegion?.name || null,
      subRegionId: newCountry.subRegionId,
      cluster: newCountry.cluster?.name || null,
      clusterId: newCountry.clusterId,
      createdAt: newCountry.createdAt.toISOString(),
      updatedAt: newCountry.updatedAt.toISOString(),
      gamePlansCount: 0
    };

    return NextResponse.json(countryData);
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      { error: 'Failed to create country' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}