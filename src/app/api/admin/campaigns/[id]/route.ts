import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Check if the campaign exists and get related counts
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if there are related game plans
    if (campaign._count.gamePlans > 0) {
      return NextResponse.json(
        { error: `Cannot delete campaign. It is being used by ${campaign._count.gamePlans} game plan(s).` },
        { status: 409 }
      );
    }

    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update a campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, rangeId } = body;
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if the campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current record)
    const duplicateCampaign = await prisma.campaign.findFirst({
      where: {
        name: name.trim(),
        id: { not: id }
      }
    });

    if (duplicateCampaign) {
      return NextResponse.json(
        { error: 'A campaign with this name already exists' },
        { status: 409 }
      );
    }

    // Validate range ID if provided
    if (rangeId) {
      const validRange = await prisma.range.findUnique({
        where: { id: rangeId }
      });

      if (!validRange) {
        return NextResponse.json(
          { error: 'Invalid range ID provided' },
          { status: 400 }
        );
      }
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: name.trim(),
        rangeId: rangeId || null
      },
      include: {
        range: true,
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const campaignData = {
      id: updatedCampaign.id,
      name: updatedCampaign.name,
      range: updatedCampaign.range?.name || null,
      rangeId: updatedCampaign.rangeId,
      createdAt: updatedCampaign.createdAt.toISOString(),
      updatedAt: updatedCampaign.updatedAt.toISOString(),
      gamePlansCount: updatedCampaign._count.gamePlans
    };

    return NextResponse.json(campaignData);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}