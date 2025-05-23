import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/getUserFromToken';

// GET /api/change-requests/[id] - Get a specific change request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid change request ID' },
        { status: 400 }
      );
    }
    
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id },
      include: {
        score: {
          include: {
            rule: true,
            country: true,
            brand: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!changeRequest) {
      return NextResponse.json(
        { error: 'Change request not found' },
        { status: 404 }
      );
    }
    
    // Ensure user property exists even if null
    const normalizedChangeRequest = {
      ...changeRequest,
      user: changeRequest.user || null
    };
    
    return NextResponse.json(normalizedChangeRequest);
  } catch (error) {
    console.error('Error fetching change request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/change-requests/[id] - Update a change request (primarily for status updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid change request ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate the request body
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!['Submitted for Review', 'Approved', 'Rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: Submitted for Review, Approved, Rejected' },
        { status: 400 }
      );
    }
    
    // Get user from token for audit purposes
    const user = getUserFromToken(request);
    
    // Check if the change request exists
    const existingRequest = await prisma.changeRequest.findUnique({
      where: { id },
      include: {
        score: true
      }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Change request not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      status: body.status,
      updatedAt: new Date()
    };
    
    // Add admin comments if provided
    if (body.adminComments) {
      updateData.adminComments = body.adminComments;
    }
    
    console.log(`Updating change request ${id} to status: ${body.status}`);
    
    // Update the change request
    const updatedRequest = await prisma.changeRequest.update({
      where: { id },
      data: updateData,
      include: {
        score: {
          include: {
            rule: true,
            country: true,
            brand: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // If the change request is approved, update the score
    if (body.status === 'Approved') {
      console.log(`Change request ${id} approved, updating score ${existingRequest.scoreId} to ${existingRequest.requestedScore}`);
      
      await prisma.score.update({
        where: { id: existingRequest.scoreId },
        data: {
          score: existingRequest.requestedScore,
          // Add any other fields that need to be updated
        }
      });
    }
    
    // Ensure user property exists even if null
    const normalizedUpdatedRequest = {
      ...updatedRequest,
      user: updatedRequest.user || null
    };
    
    return NextResponse.json(normalizedUpdatedRequest);
  } catch (error) {
    console.error('Error updating change request:', error);
    return NextResponse.json(
      { error: 'Failed to update change request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/change-requests/[id] - Delete a change request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid change request ID' },
        { status: 400 }
      );
    }
    
    // Check if the change request exists
    const existingRequest = await prisma.changeRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Change request not found' },
        { status: 404 }
      );
    }
    
    // Delete the change request
    await prisma.changeRequest.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting change request:', error);
    return NextResponse.json(
      { error: 'Failed to delete change request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
