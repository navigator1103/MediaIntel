import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get a specific last update/financial cycle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format'
        },
        { status: 400 }
      );
    }

    const lastUpdate = await prisma.lastUpdate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!lastUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Financial cycle not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lastUpdate
    });
  } catch (error) {
    console.error('Error fetching last update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch financial cycle'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a last update/financial cycle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name } = body;
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format'
        },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required and must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // Check if the last update exists
    const existingLastUpdate = await prisma.lastUpdate.findUnique({
      where: { id }
    });

    if (!existingLastUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Financial cycle not found'
        },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateLastUpdate = await prisma.lastUpdate.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateLastUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A financial cycle with this name already exists'
        },
        { status: 409 }
      );
    }

    const updatedLastUpdate = await prisma.lastUpdate.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedLastUpdate,
      message: 'Financial cycle updated successfully'
    });
  } catch (error) {
    console.error('Error updating last update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update financial cycle'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete a last update/financial cycle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format'
        },
        { status: 400 }
      );
    }

    // Check if the last update exists and get related game plans count
    const lastUpdate = await prisma.lastUpdate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!lastUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Financial cycle not found'
        },
        { status: 404 }
      );
    }

    // Prevent deletion if there are related game plans
    if (lastUpdate._count.gamePlans > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete financial cycle. It is being used by ${lastUpdate._count.gamePlans} game plan(s). Please remove or reassign these game plans first.`
        },
        { status: 409 }
      );
    }

    await prisma.lastUpdate.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Financial cycle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting last update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete financial cycle'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}