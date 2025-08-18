import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    // Fetch business units with their categories using the new many-to-many relationship
    const businessUnits = await prisma.businessUnit.findMany({
      orderBy: { name: 'asc' },
      include: {
        businessUnitToCategories: {
          include: {
            category: {
              include: {
                ranges: {
                  include: {
                    range: {
                      include: {
                        campaigns: true
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    gamePlans: true
                  }
                }
              }
            }
          },
          orderBy: {
            category: {
              name: 'asc'
            }
          }
        }
      }
    });

    // Transform to hierarchical structure
    const hierarchicalData = businessUnits.map(bu => ({
      id: bu.id,
      name: bu.name,
      categoriesCount: bu.businessUnitToCategories.length,
      categories: bu.businessUnitToCategories.map(butc => ({
        id: butc.category.id,
        name: butc.category.name,
        businessUnitId: bu.id,
        businessUnitName: bu.name,
        createdAt: butc.category.createdAt.toISOString(),
        updatedAt: butc.category.updatedAt.toISOString(),
        ranges: butc.category.ranges.map(r => ({
          id: r.range.id,
          name: r.range.name,
          campaignsCount: r.range.campaigns?.length || 0
        })),
        rangesCount: butc.category.ranges.length,
        gamePlansCount: butc.category._count.gamePlans
      }))
    }));

    return NextResponse.json(hierarchicalData);
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
    const { name, businessUnitId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business Unit is required' },
        { status: 400 }
      );
    }

    // Check if name already exists for this business unit
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: name.trim(),
        businessUnitId: businessUnitId
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists for this business unit' },
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim()
      }
    });

    // Create the business unit to category relationship
    await prisma.businessUnitToCategory.create({
      data: {
        businessUnitId: businessUnitId,
        categoryId: newCategory.id
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