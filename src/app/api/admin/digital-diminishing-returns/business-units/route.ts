import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json(businessUnits);
  } catch (error: any) {
    console.error('Error fetching business units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business units', details: error.message },
      { status: 500 }
    );
  }
}