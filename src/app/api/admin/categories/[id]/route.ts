import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Delete a category
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

    // Check if the category exists and get related counts
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true,
            ranges: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if there are related game plans
    if (category._count.gamePlans > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It is being used by ${category._count.gamePlans} game plan(s).` },
        { status: 409 }
      );
    }

    // Prevent deletion if there are related ranges
    if (category._count.ranges > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It has ${category._count.ranges} associated range(s).` },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a category
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

    // Check if the category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim()
      },
      include: {
        ranges: {
          include: {
            range: true
          }
        },
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const categoryData = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      createdAt: updatedCategory.createdAt.toISOString(),
      updatedAt: updatedCategory.updatedAt.toISOString(),
      ranges: updatedCategory.ranges.map(r => r.range.name),
      rangesCount: updatedCategory.ranges.length,
      gamePlansCount: updatedCategory._count.gamePlans
    };

    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}