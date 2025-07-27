import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(countries);
  } catch (error: any) {
    console.error('Error loading countries:', error);
    return NextResponse.json({
      error: 'Failed to load countries',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}