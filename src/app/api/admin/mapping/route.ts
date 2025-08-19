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
                        campaigns: true,
                        campaignRanges: {
                          include: {
                            campaign: true
                          }
                        }
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

    // Transform the data into a hierarchical structure with business-unit-specific filtering
    const mappingData = businessUnits.map(bu => ({
      id: bu.id,
      name: bu.name,
      categoriesCount: bu.businessUnitToCategories.length,
      categories: bu.businessUnitToCategories.map(butc => {
        // Apply business-unit-specific filtering for shared categories
        let filteredRanges = butc.category.ranges;
        
        // Special handling for Sun category
        if (butc.category.name === 'Sun') {
          if (bu.name === 'Derma') {
            // Derma should only see the "Sun" range
            filteredRanges = butc.category.ranges.filter(cr => 
              cr.range.name === 'Sun'
            );
          }
          // Nivea sees all 3 ranges (no filtering needed)
        }
        
        // Special handling for X-Cat category
        if (butc.category.name === 'X-Cat') {
          if (bu.name === 'Nivea') {
            // Nivea should only see X-Range
            filteredRanges = butc.category.ranges.filter(cr => 
              cr.range.name === 'X-Range'
            );
          } else if (bu.name === 'Derma') {
            // Derma should only see X-Cat range
            filteredRanges = butc.category.ranges.filter(cr => 
              cr.range.name === 'X-Cat'
            );
          }
        }
        
        // Special handling for Acne range campaigns (shared range, different campaigns per BU)
        filteredRanges = filteredRanges.map(categoryRange => {
          // Use campaigns from many-to-many relationship (campaignRanges) instead of direct campaigns
          const allCampaigns = categoryRange.range.campaignRanges.map(cr => cr.campaign);
          let filteredCampaigns = allCampaigns;
          
          if (categoryRange.range.name === 'Acne') {
            // Filter campaigns based on business unit
            if (bu.name === 'Nivea') {
              // Nivea should see template-specific campaigns
              const niveaAcneCampaigns = ['Genzit', 'Derma Skin Clear', 'Acne Control', 'Claro', 'Bright Oil Clear'];
              filteredCampaigns = allCampaigns.filter(campaign => 
                niveaAcneCampaigns.includes(campaign.name)
              );
            } else if (bu.name === 'Derma') {
              // Derma should see template-specific campaigns
              const dermaAcneCampaigns = [
                'Dermopure Body (Bacne)', 'Dermopure RL', 'Dermo Purifyer', 
                'Gel to Foam', 'Triple Effect', 'Dermopure Cleansing (Activia)', 
                'Dermopure Cleansing (Yoda)', 'Anti-Acne Range'
              ];
              filteredCampaigns = allCampaigns.filter(campaign => 
                dermaAcneCampaigns.includes(campaign.name)
              );
            }
          }
          
          return {
            ...categoryRange,
            range: {
              ...categoryRange.range,
              campaigns: filteredCampaigns
            }
          };
        });
        
        // Apply campaign name normalization for shared campaigns
        filteredRanges = filteredRanges.map(categoryRange => {
          const normalizedCampaigns = categoryRange.range.campaigns.map(campaign => {
            let displayName = campaign.name;
            
            // Normalize shared campaign names by removing business unit postfixes
            if (bu.name === 'Derma') {
              // Remove Derma-specific postfixes to show clean shared names
              if (campaign.name === 'Search AWON (Derma-Dry Skin)') {
                displayName = 'Search AWON';
              }
              // Add more shared campaign normalizations here as needed
              if (campaign.name.includes('(Derma-') && campaign.name.includes(')')) {
                // Generic pattern: "Campaign Name (Derma-Range)" -> "Campaign Name"
                displayName = campaign.name.replace(/\s*\(Derma-[^)]+\)/g, '');
              }
            }
            
            return {
              ...campaign,
              name: displayName
            };
          });
          
          return {
            ...categoryRange,
            range: {
              ...categoryRange.range,
              campaigns: normalizedCampaigns
            }
          };
        });
        
        return {
          id: butc.category.id,
          name: butc.category.name,
          rangesCount: filteredRanges.length,
          ranges: filteredRanges.map(categoryRange => ({
            id: categoryRange.range.id,
            name: categoryRange.range.name,
            campaignsCount: categoryRange.range.campaigns.length,
            campaigns: categoryRange.range.campaigns.map(campaign => ({
              id: campaign.id,
              name: campaign.name,
              status: campaign.status || 'Active'
            }))
          }))
        };
      })
    }));

    // Calculate totals based on filtered data
    const totals = {
      businessUnits: mappingData.length,
      categories: mappingData.reduce((sum, bu) => sum + bu.categories.length, 0),
      ranges: mappingData.reduce((sum, bu) => 
        sum + bu.categories.reduce((catSum, cat) => catSum + cat.ranges.length, 0), 0
      ),
      campaigns: mappingData.reduce((sum, bu) => 
        sum + bu.categories.reduce((catSum, cat) => 
          catSum + cat.ranges.reduce((rangeSum, range) => 
            rangeSum + range.campaigns.length, 0
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