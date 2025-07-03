import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get a specific country
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const country = await prisma.country.findUnique({
      where: { id },
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

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    // Transform to match the expected interface
    const countryData = {
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
    };

    return NextResponse.json(countryData);
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a country
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, regionId, subRegionId, clusterId } = body;
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if the country exists
    const existingCountry = await prisma.country.findUnique({
      where: { id }
    });

    if (!existingCountry) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateCountry = await prisma.country.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateCountry) {
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

    const updatedCountry = await prisma.country.update({
      where: { id },
      data: {
        name: name.trim(),
        regionId: regionId || null,
        subRegionId: subRegionId || null,
        clusterId: clusterId || null
      },
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
    const countryData = {
      id: updatedCountry.id,
      name: updatedCountry.name,
      region: updatedCountry.region?.name || null,
      regionId: updatedCountry.regionId,
      subRegion: updatedCountry.subRegion?.name || null,
      subRegionId: updatedCountry.subRegionId,
      cluster: updatedCountry.cluster?.name || null,
      clusterId: updatedCountry.clusterId,
      createdAt: updatedCountry.createdAt.toISOString(),
      updatedAt: updatedCountry.updatedAt.toISOString(),
      gamePlansCount: updatedCountry._count.gamePlans
    };

    return NextResponse.json(countryData);
  } catch (error) {
    console.error('Error updating country:', error);
    return NextResponse.json(
      { error: 'Failed to update country' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete a country
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Check if the country exists and get related game plans count
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if there are related game plans
    if (country._count.gamePlans > 0) {
      return NextResponse.json(
        { error: `Cannot delete country. It is being used by ${country._count.gamePlans} game plan(s). Please remove or reassign these game plans first.` },
        { status: 409 }
      );
    }

    await prisma.country.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Country deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting country:', error);
    return NextResponse.json(
      { error: 'Failed to delete country' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}