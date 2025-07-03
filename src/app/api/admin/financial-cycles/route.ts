import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all financial cycles (last updates)
export async function GET(request: NextRequest) {
  try {
    const financialCycles = await prisma.lastUpdate.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const cycles = financialCycles.map(cycle => ({
      id: cycle.id,
      name: cycle.name,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
      gamePlansCount: cycle._count.gamePlans
    }));

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Error fetching financial cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial cycles' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new financial cycle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingCycle = await prisma.lastUpdate.findUnique({
      where: { name: name.trim() }
    });

    if (existingCycle) {
      return NextResponse.json(
        { error: 'A financial cycle with this name already exists' },
        { status: 409 }
      );
    }

    const newCycle = await prisma.lastUpdate.create({
      data: {
        name: name.trim()
      }
    });

    // Transform to match the expected interface
    const cycle = {
      id: newCycle.id,
      name: newCycle.name,
      createdAt: newCycle.createdAt.toISOString(),
      updatedAt: newCycle.updatedAt.toISOString(),
      gamePlansCount: 0
    };

    return NextResponse.json(cycle);
  } catch (error) {
    console.error('Error creating financial cycle:', error);
    return NextResponse.json(
      { error: 'Failed to create financial cycle' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}