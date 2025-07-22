import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json(countries);
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries', details: error.message },
      { status: 500 }
    );
  }
}