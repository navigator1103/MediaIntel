import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all pending entities for governance review
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending_review';
    const type = url.searchParams.get('type'); // 'campaign' or 'range' or null for both

    // Get campaigns for governance review (pending_review OR auto-created)
    let pendingCampaigns = [];
    if (!type || type === 'campaign') {
      const whereCondition = status === 'pending_review' 
        ? {
            OR: [
              { status: 'pending_review' },
              { createdBy: 'auto-import' } // Show auto-created entities regardless of status
            ]
          }
        : { status };

      pendingCampaigns = await prisma.campaign.findMany({
        where: whereCondition,
        include: {
          range: true,
          _count: {
            select: {
              gamePlans: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Get ranges for governance review (pending_review OR auto-created)
    let pendingRanges = [];
    if (!type || type === 'range') {
      const whereCondition = status === 'pending_review' 
        ? {
            OR: [
              { status: 'pending_review' },
              { createdBy: 'auto-import' } // Show auto-created entities regardless of status
            ]
          }
        : { status };

      pendingRanges = await prisma.range.findMany({
        where: whereCondition,
        include: {
          campaigns: {
            // Include ALL campaigns linked to this range, not just auto-imported ones
            include: {
              _count: {
                select: {
                  gamePlans: true
                }
              }
            }
          },
          categories: {
            include: {
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Transform data for frontend
    const transformedCampaigns = pendingCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: 'campaign' as const,
      status: campaign.status,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt.toISOString(),
      reviewedBy: campaign.reviewedBy,
      reviewedAt: campaign.reviewedAt?.toISOString(),
      originalName: campaign.originalName,
      notes: campaign.notes,
      usageCount: campaign._count.gamePlans,
      relatedRange: campaign.range?.name || null,
      mergedInto: campaign.mergedInto
    }));

    const transformedRanges = pendingRanges.map(range => ({
      id: range.id,
      name: range.name,
      type: 'range' as const,
      status: range.status,
      createdBy: range.createdBy,
      createdAt: range.createdAt.toISOString(),
      reviewedBy: range.reviewedBy,
      reviewedAt: range.reviewedAt?.toISOString(),
      originalName: range.originalName,
      notes: range.notes,
      usageCount: range.campaigns.reduce((sum, campaign) => sum + campaign._count.gamePlans, 0),
      relatedCategories: range.categories.map(c => c.category.name),
      campaignsCount: range.campaigns.length,
      mergedInto: range.mergedInto
    }));

    // Combine and sort by creation date
    const allEntities = [...transformedCampaigns, ...transformedRanges]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get summary statistics
    const stats = {
      pendingCampaigns: transformedCampaigns.length, // All campaigns shown need review
      pendingRanges: transformedRanges.length, // All ranges shown need review  
      totalPending: allEntities.length, // All entities shown need review
      highUsage: allEntities.filter(e => e.usageCount > 10).length,
      approvedToday: allEntities.filter(e => 
        e.reviewedAt && 
        new Date(e.reviewedAt).toDateString() === new Date().toDateString() &&
        e.status === 'active'
      ).length,
      mergedToday: allEntities.filter(e => 
        e.reviewedAt && 
        new Date(e.reviewedAt).toDateString() === new Date().toDateString() &&
        e.status === 'merged'
      ).length
    };

    return NextResponse.json({
      entities: allEntities,
      stats
    });
  } catch (error) {
    console.error('Error fetching governance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}