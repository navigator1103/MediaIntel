import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(businessUnits);
  } catch (error: any) {
    console.error('Error loading business units:', error);
    return NextResponse.json({
      error: 'Failed to load business units',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}