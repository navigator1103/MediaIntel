import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Campaign archetype name is required' },
        { status: 400 }
      );
    }

    const existingArchetype = await prisma.campaignArchetype.findFirst({
      where: {
        name: name.trim(),
        NOT: { id }
      }
    });

    if (existingArchetype) {
      return NextResponse.json(
        { error: 'Another campaign archetype with this name already exists' },
        { status: 400 }
      );
    }

    const archetype = await prisma.campaignArchetype.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json(archetype);
  } catch (error) {
    console.error('Error updating campaign archetype:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign archetype' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const archetype = await prisma.campaignArchetype.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!archetype) {
      return NextResponse.json(
        { error: 'Campaign archetype not found' },
        { status: 404 }
      );
    }

    if (archetype._count.gamePlans > 0) {
      return NextResponse.json(
        { error: `Cannot delete campaign archetype. It is used in ${archetype._count.gamePlans} game plan(s).` },
        { status: 400 }
      );
    }

    await prisma.campaignArchetype.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Campaign archetype deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign archetype:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign archetype' },
      { status: 500 }
    );
  }
}