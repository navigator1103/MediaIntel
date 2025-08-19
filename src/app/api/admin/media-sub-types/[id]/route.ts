import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Delete a media sub type
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid media sub type ID' },
        { status: 400 }
      );
    }

    // Check if media sub type exists
    const existingSubType = await prisma.mediaSubType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!existingSubType) {
      return NextResponse.json(
        { error: 'Media sub type not found' },
        { status: 404 }
      );
    }

    // Check if media sub type is used in game plans
    if (existingSubType._count.gamePlans > 0) {
      return NextResponse.json(
        { error: `Cannot delete media sub type. It is used in ${existingSubType._count.gamePlans} game plans.` },
        { status: 400 }
      );
    }

    // Check and delete PMType relationships first
    const pmTypeRelations = await prisma.pMTypeToMediaSubType.findMany({
      where: { mediaSubTypeId: id }
    });

    if (pmTypeRelations.length > 0) {
      console.log(`Deleting ${pmTypeRelations.length} PMType relationships for media sub type ${id}`);
      await prisma.pMTypeToMediaSubType.deleteMany({
        where: { mediaSubTypeId: id }
      });
    }

    // Delete the media sub type
    await prisma.mediaSubType.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Media sub type deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting media sub type:', error);
    return NextResponse.json(
      { error: 'Failed to delete media sub type' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a media sub type
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { name, mediaTypeId } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid media sub type ID' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if media sub type exists
    const existingSubType = await prisma.mediaSubType.findUnique({
      where: { id }
    });

    if (!existingSubType) {
      return NextResponse.json(
        { error: 'Media sub type not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateSubType = await prisma.mediaSubType.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateSubType) {
      return NextResponse.json(
        { error: 'A media sub type with this name already exists' },
        { status: 409 }
      );
    }

    // If mediaTypeId is provided, check if media type exists
    if (mediaTypeId !== undefined) {
      if (typeof mediaTypeId !== 'number') {
        return NextResponse.json(
          { error: 'Media Type ID must be a number' },
          { status: 400 }
        );
      }

      const mediaType = await prisma.mediaType.findUnique({
        where: { id: mediaTypeId }
      });

      if (!mediaType) {
        return NextResponse.json(
          { error: 'Media Type not found' },
          { status: 404 }
        );
      }
    }

    // Update the media sub type
    const updatedSubType = await prisma.mediaSubType.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(mediaTypeId !== undefined && { mediaTypeId })
      },
      include: {
        mediaType: true
      }
    });

    // Transform to match the expected interface
    const subTypeData = {
      id: updatedSubType.id,
      name: updatedSubType.name,
      mediaTypeId: updatedSubType.mediaTypeId,
      mediaTypeName: updatedSubType.mediaType?.name || null,
      createdAt: updatedSubType.createdAt.toISOString(),
      updatedAt: updatedSubType.updatedAt.toISOString()
    };

    return NextResponse.json(subTypeData);
  } catch (error) {
    console.error('Error updating media sub type:', error);
    return NextResponse.json(
      { error: 'Failed to update media sub type' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}