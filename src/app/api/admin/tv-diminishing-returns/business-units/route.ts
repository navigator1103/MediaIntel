import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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