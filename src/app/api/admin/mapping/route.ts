import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/getUserFromToken';

export async function GET(request: NextRequest) {
  try {
    // Check if user is super_admin only
    const user = getUserFromToken(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super admin access required' },
        { status: 401 }
      );
    }

    // Fetch all business units with their nested relationships using many-to-many
    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        businessUnitToCategories: {
          include: {
            category: {
              include: {
                ranges: {
                  include: {
                    range: {
                      include: {
                        campaigns: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            category: {
              name: 'asc'
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the data into a hierarchical structure
    const mappingData = businessUnits.map(bu => ({
      id: bu.id,
      name: bu.name,
      categoriesCount: bu.businessUnitToCategories.length,
      categories: bu.businessUnitToCategories.map(butc => ({
        id: butc.category.id,
        name: butc.category.name,
        rangesCount: butc.category.ranges.length,
        ranges: butc.category.ranges.map(categoryRange => ({
          id: categoryRange.range.id,
          name: categoryRange.range.name,
          campaignsCount: categoryRange.range.campaigns.length,
          campaigns: categoryRange.range.campaigns.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status || 'Active'
          }))
        }))
      }))
    }));

    // Calculate totals
    const totals = {
      businessUnits: businessUnits.length,
      categories: businessUnits.reduce((sum, bu) => sum + bu.businessUnitToCategories.length, 0),
      ranges: businessUnits.reduce((sum, bu) => 
        sum + bu.businessUnitToCategories.reduce((catSum, butc) => catSum + butc.category.ranges.length, 0), 0
      ),
      campaigns: businessUnits.reduce((sum, bu) => 
        sum + bu.businessUnitToCategories.reduce((catSum, butc) => 
          catSum + butc.category.ranges.reduce((rangeSum, categoryRange) => 
            rangeSum + categoryRange.range.campaigns.length, 0
          ), 0
        ), 0
      )
    };

    return NextResponse.json({
      mappingData,
      totals
    });

  } catch (error) {
    console.error('Error fetching mapping data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is super_admin only
    const user = getUserFromToken(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, type } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let updated;

    switch (type) {
      case 'businessUnit':
        updated = await prisma.businessUnit.update({
          where: { id },
          data: { name }
        });
        break;
      case 'category':
        updated = await prisma.category.update({
          where: { id },
          data: { name }
        });
        break;
      case 'range':
        updated = await prisma.range.update({
          where: { id },
          data: { name }
        });
        break;
      case 'campaign':
        updated = await prisma.campaign.update({
          where: { id },
          data: { name }
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: updated });

  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is super_admin only
    const user = getUserFromToken(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let deleted;

    switch (type) {
      case 'businessUnit':
        // Check if business unit has categories
        const categoriesCount = await prisma.category.count({
          where: { businessUnitId: id }
        });
        const gamePlansCount = await prisma.gamePlan.count({
          where: { businessUnitId: id }
        });
        
        if (categoriesCount > 0 || gamePlansCount > 0) {
          return NextResponse.json(
            { error: `Cannot delete: This business unit has ${categoriesCount} categories and ${gamePlansCount} game plans` },
            { status: 400 }
          );
        }
        
        deleted = await prisma.businessUnit.delete({
          where: { id }
        });
        break;
        
      case 'category':
        // Check if category has ranges
        const rangesCount = await prisma.categoryToRange.count({
          where: { categoryId: id }
        });
        
        if (rangesCount > 0) {
          return NextResponse.json(
            { error: `Cannot delete: This category has ${rangesCount} ranges` },
            { status: 400 }
          );
        }
        
        deleted = await prisma.category.delete({
          where: { id }
        });
        break;
        
      case 'range':
        // Check if range has campaigns
        const campaignsCount = await prisma.campaign.count({
          where: { rangeId: id }
        });
        
        if (campaignsCount > 0) {
          return NextResponse.json(
            { error: `Cannot delete: This range has ${campaignsCount} campaigns` },
            { status: 400 }
          );
        }
        
        // Delete the many-to-many relationships first
        await prisma.categoryToRange.deleteMany({
          where: { rangeId: id }
        });
        
        deleted = await prisma.range.delete({
          where: { id }
        });
        break;
        
      case 'campaign':
        // Check if campaign has game plans
        const gamePlans = await prisma.gamePlan.count({
          where: { campaignId: id }
        });
        
        if (gamePlans > 0) {
          return NextResponse.json(
            { error: `Cannot delete: This campaign has ${gamePlans} game plans` },
            { status: 400 }
          );
        }
        
        deleted = await prisma.campaign.delete({
          where: { id }
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: deleted });

  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is super_admin only
    const user = getUserFromToken(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, name, rangeId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Currently only supporting campaign creation
    if (type !== 'campaign') {
      return NextResponse.json(
        { error: 'Only campaign creation is supported through this endpoint' },
        { status: 400 }
      );
    }

    if (!rangeId) {
      return NextResponse.json(
        { error: 'Range ID is required for campaign creation' },
        { status: 400 }
      );
    }

    // Check if the range exists
    const range = await prisma.range.findUnique({
      where: { id: rangeId }
    });

    if (!range) {
      return NextResponse.json(
        { error: 'Range not found' },
        { status: 404 }
      );
    }

    // Check if campaign with this name already exists
    const existingCampaign = await prisma.campaign.findFirst({
      where: { 
        name: name.trim()
      }
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: 'A campaign with this name already exists' },
        { status: 400 }
      );
    }

    // Create the new campaign
    const newCampaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        status: 'Active'
      }
    });

    // Link the campaign to the range
    await prisma.rangeToCampaign.create({
      data: {
        rangeId: rangeId,
        campaignId: newCampaign.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newCampaign,
      message: `Campaign "${name}" added to range successfully`
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}