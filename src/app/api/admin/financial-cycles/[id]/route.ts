import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get a specific financial cycle
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

    const cycle = await prisma.lastUpdate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json(
        { error: 'Financial cycle not found' },
        { status: 404 }
      );
    }

    // Transform to match the expected interface
    const financialCycle = {
      id: cycle.id,
      name: cycle.name,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
      gamePlansCount: cycle._count.gamePlans
    };

    return NextResponse.json(financialCycle);
  } catch (error) {
    console.error('Error fetching financial cycle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial cycle' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a financial cycle
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

    // Check if the financial cycle exists
    const existingCycle = await prisma.lastUpdate.findUnique({
      where: { id }
    });

    if (!existingCycle) {
      return NextResponse.json(
        { error: 'Financial cycle not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateCycle = await prisma.lastUpdate.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateCycle) {
      return NextResponse.json(
        { error: 'A financial cycle with this name already exists' },
        { status: 409 }
      );
    }

    const updatedCycle = await prisma.lastUpdate.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    // Transform to match the expected interface
    const cycle = {
      id: updatedCycle.id,
      name: updatedCycle.name,
      createdAt: updatedCycle.createdAt.toISOString(),
      updatedAt: updatedCycle.updatedAt.toISOString(),
      gamePlansCount: 0 // We'll need to fetch this if needed
    };

    return NextResponse.json(cycle);
  } catch (error) {
    console.error('Error updating financial cycle:', error);
    return NextResponse.json(
      { error: 'Failed to update financial cycle' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete a financial cycle
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

    // Check if the financial cycle exists and get related game plans count
    const cycle = await prisma.lastUpdate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json(
        { error: 'Financial cycle not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if there are related game plans
    if (cycle._count.gamePlans > 0) {
      return NextResponse.json(
        { error: `Cannot delete financial cycle. It is being used by ${cycle._count.gamePlans} game plan(s). Please remove or reassign these game plans first.` },
        { status: 409 }
      );
    }

    await prisma.lastUpdate.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Financial cycle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting financial cycle:', error);
    return NextResponse.json(
      { error: 'Failed to delete financial cycle' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}