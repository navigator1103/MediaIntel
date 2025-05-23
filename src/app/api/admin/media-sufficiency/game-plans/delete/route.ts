import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: No IDs provided for deletion' },
        { status: 400 }
      );
    }
    
    // Delete the game plans with the provided IDs
    const result = await prisma.gamePlan.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });
    
    return NextResponse.json({
      message: `Successfully deleted ${result.count} game plan(s)`,
      count: result.count
    });
  } catch (error) {
    console.error('Error deleting game plans:', error);
    return NextResponse.json(
      { error: 'Failed to delete game plans' },
      { status: 500 }
    );
  }
}
