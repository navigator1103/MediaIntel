import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all last updates/financial cycles
export async function GET(request: NextRequest) {
  try {
    const lastUpdates = await prisma.lastUpdate.findMany({
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

    return NextResponse.json({
      success: true,
      data: lastUpdates
    });
  } catch (error) {
    console.error('Error fetching last updates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch last updates'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new last update/financial cycle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required and must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingLastUpdate = await prisma.lastUpdate.findUnique({
      where: { name: name.trim() }
    });

    if (existingLastUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A financial cycle with this name already exists'
        },
        { status: 409 }
      );
    }

    const newLastUpdate = await prisma.lastUpdate.create({
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json({
      success: true,
      data: newLastUpdate,
      message: 'Financial cycle created successfully'
    });
  } catch (error) {
    console.error('Error creating last update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create financial cycle'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}