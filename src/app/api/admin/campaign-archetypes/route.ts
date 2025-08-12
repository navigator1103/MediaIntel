import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const archetypes = await prisma.campaignArchetype.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    const formattedArchetypes = archetypes.map(archetype => ({
      id: archetype.id,
      name: archetype.name,
      createdAt: archetype.createdAt.toISOString(),
      updatedAt: archetype.updatedAt.toISOString(),
      gamePlansCount: archetype._count.gamePlans
    }));

    return NextResponse.json(formattedArchetypes);
  } catch (error) {
    console.error('Error fetching campaign archetypes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign archetypes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Campaign archetype name is required' },
        { status: 400 }
      );
    }

    const existingArchetype = await prisma.campaignArchetype.findUnique({
      where: { name: name.trim() }
    });

    if (existingArchetype) {
      return NextResponse.json(
        { error: 'Campaign archetype with this name already exists' },
        { status: 400 }
      );
    }

    const archetype = await prisma.campaignArchetype.create({
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json(archetype);
  } catch (error) {
    console.error('Error creating campaign archetype:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign archetype' },
      { status: 500 }
    );
  }
}