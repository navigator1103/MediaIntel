import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all media types with their subtypes
export async function GET(request: NextRequest) {
  try {
    const mediaTypes = await prisma.mediaType.findMany({
      select: {
        id: true,
        name: true,
        mediaSubTypes: {
          select: {
            id: true,
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(mediaTypes);
  } catch (error) {
    console.error('Error fetching media types:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch media types', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}