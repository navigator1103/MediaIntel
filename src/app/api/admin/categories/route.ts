import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { name: 'asc' }
      ],
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
    const categoriesData = categories.map(category => ({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      ranges: category.ranges.map(r => r.range.name),
      rangesCount: category.ranges.length,
      gamePlansCount: category._count.gamePlans
    }));

    return NextResponse.json(categoriesData);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new category
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
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim()
      }
    });

    // Transform to match the expected interface
    const categoryData = {
      id: newCategory.id,
      name: newCategory.name,
      createdAt: newCategory.createdAt.toISOString(),
      updatedAt: newCategory.updatedAt.toISOString(),
      ranges: [],
      rangesCount: 0,
      gamePlansCount: 0
    };

    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}