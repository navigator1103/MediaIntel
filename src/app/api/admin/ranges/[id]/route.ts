import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Delete a range
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

    // Check if the range exists and get related counts
    const range = await prisma.range.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    if (!range) {
      return NextResponse.json(
        { error: 'Range not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if there are related campaigns
    if (range._count.campaigns > 0) {
      return NextResponse.json(
        { error: `Cannot delete range. It has ${range._count.campaigns} associated campaign(s).` },
        { status: 409 }
      );
    }

    // Delete the range (categories relationship will be handled by cascade)
    await prisma.range.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Range deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting range:', error);
    return NextResponse.json(
      { error: 'Failed to delete range' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a range
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, categoryIds } = body;
    
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

    // Check if the range exists
    const existingRange = await prisma.range.findUnique({
      where: { id }
    });

    if (!existingRange) {
      return NextResponse.json(
        { error: 'Range not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateRange = await prisma.range.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateRange) {
      return NextResponse.json(
        { error: 'A range with this name already exists' },
        { status: 409 }
      );
    }

    // Validate category IDs if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const validCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } }
      });

      if (validCategories.length !== categoryIds.length) {
        return NextResponse.json(
          { error: 'One or more invalid category IDs provided' },
          { status: 400 }
        );
      }
    }

    // Update the range with new categories
    const updatedRange = await prisma.range.update({
      where: { id },
      data: {
        name: name.trim(),
        categories: {
          deleteMany: {}, // Remove all existing category relationships
          ...(categoryIds && categoryIds.length > 0 && {
            create: categoryIds.map((categoryId: number) => ({
              category: {
                connect: { id: categoryId }
              }
            }))
          })
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const rangeData = {
      id: updatedRange.id,
      name: updatedRange.name,
      createdAt: updatedRange.createdAt.toISOString(),
      updatedAt: updatedRange.updatedAt.toISOString(),
      categories: updatedRange.categories.map(c => c.category.name),
      categoriesCount: updatedRange.categories.length,
      campaignsCount: updatedRange._count.campaigns
    };

    return NextResponse.json(rangeData);
  } catch (error) {
    console.error('Error updating range:', error);
    return NextResponse.json(
      { error: 'Failed to update range' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}