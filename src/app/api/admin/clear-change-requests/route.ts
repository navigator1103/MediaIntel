import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/clear-change-requests - Get info about change requests and clear them
export async function POST(request: NextRequest) {
  try {
    // First, get summary information about the change requests
    const changeRequestsCount = await prisma.changeRequest.count();
    
    // Get unique users who submitted change requests (if user info is stored)
    // Note: This assumes there's a userId or similar field in the changeRequest model
    // If not, this will return an empty array
    let submitters = [];
    try {
      const changeRequests = await prisma.changeRequest.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true
        }
      });
      
      // Group by creation date (day)
      const groupedByDate = changeRequests.reduce((acc, cr) => {
        const date = new Date(cr.createdAt).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      }, {});
      
      // Group by status
      const groupedByStatus = changeRequests.reduce((acc, cr) => {
        if (!acc[cr.status]) {
          acc[cr.status] = 0;
        }
        acc[cr.status]++;
        return acc;
      }, {});
      
      submitters = {
        byDate: groupedByDate,
        byStatus: groupedByStatus
      };
    } catch (error) {
      console.error('Error getting change request submitters:', error);
    }
    
    // Now delete all change requests
    const deletedCount = await prisma.changeRequest.deleteMany({});
    
    return NextResponse.json({
      message: `Successfully deleted ${deletedCount.count} change requests`,
      originalCount: changeRequestsCount,
      submissionInfo: submitters
    });
  } catch (error) {
    console.error('Error clearing change requests:', error);
    return NextResponse.json(
      { error: 'Failed to clear change requests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
