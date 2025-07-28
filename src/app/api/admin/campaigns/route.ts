import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all campaigns
export async function GET(request: NextRequest) {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: [
        { name: 'asc' }
      ],
      include: {
        range: {
          include: {
            categories: {
              include: {
                category: {
                  include: {
                    businessUnit: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            gamePlans: true
          }
        }
      }
    });

    // Transform to match the expected interface
    const campaignsData = campaigns.map(campaign => {
      // Extract categories and business units from the nested relationship
      const categories = campaign.range?.categories?.map(ct => ct.category.name) || [];
      const businessUnits = campaign.range?.categories?.map(ct => ct.category.businessUnit?.name).filter(Boolean) || [];
      
      return {
        id: campaign.id,
        name: campaign.name,
        range: campaign.range?.name || null,
        rangeId: campaign.rangeId,
        categories: [...new Set(categories)], // Remove duplicates
        businessUnits: [...new Set(businessUnits)], // Remove duplicates
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
        gamePlansCount: campaign._count.gamePlans
      };
    });

    return NextResponse.json(campaignsData);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rangeId } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { name: name.trim() }
    });

    if (existingCampaign) {
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

    const newCampaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        rangeId: rangeId || null
      },
      include: {
        range: true
      }
    });

    // Transform to match the expected interface
    const campaignData = {
      id: newCampaign.id,
      name: newCampaign.name,
      range: newCampaign.range?.name || null,
      rangeId: newCampaign.rangeId,
      createdAt: newCampaign.createdAt.toISOString(),
      updatedAt: newCampaign.updatedAt.toISOString(),
      gamePlansCount: 0
    };

    return NextResponse.json(campaignData);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}