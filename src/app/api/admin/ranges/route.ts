import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all ranges
export async function GET(request: NextRequest) {
  try {
    const ranges = await prisma.range.findMany({
      orderBy: [
        { name: 'asc' }
      ],
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
    const rangesData = ranges.map(range => ({
      id: range.id,
      name: range.name,
      createdAt: range.createdAt.toISOString(),
      updatedAt: range.updatedAt.toISOString(),
      categories: range.categories.map(c => c.category.name),
      categoriesCount: range.categories.length,
      campaignsCount: range._count.campaigns
    }));

    return NextResponse.json(rangesData);
  } catch (error) {
    console.error('Error fetching ranges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ranges' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new range
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryIds } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingRange = await prisma.range.findUnique({
      where: { name: name.trim() }
    });

    if (existingRange) {
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

    const newRange = await prisma.range.create({
      data: {
        name: name.trim(),
        ...(categoryIds && categoryIds.length > 0 && {
          categories: {
            create: categoryIds.map((categoryId: number) => ({
              category: {
                connect: { id: categoryId }
              }
            }))
          }
        })
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const rangeData = {
      id: newRange.id,
      name: newRange.name,
      createdAt: newRange.createdAt.toISOString(),
      updatedAt: newRange.updatedAt.toISOString(),
      categories: newRange.categories.map(c => c.category.name),
      categoriesCount: newRange.categories.length,
      campaignsCount: 0
    };

    return NextResponse.json(rangeData);
  } catch (error) {
    console.error('Error creating range:', error);
    return NextResponse.json(
      { error: 'Failed to create range' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}