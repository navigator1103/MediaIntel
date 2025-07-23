import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('LastUpdate API endpoint called - fetching from database');
    
    // Fetch all last updates from the database
    const lastUpdates = await prisma.lastUpdate.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Fetched ${lastUpdates.length} last updates from database`);

    return NextResponse.json(lastUpdates);
    
  } catch (error) {
    console.error('Error fetching last updates from database:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch last updates from database' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
