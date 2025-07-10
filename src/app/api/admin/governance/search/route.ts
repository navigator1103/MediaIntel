import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Search for existing entities to merge into
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const query = url.searchParams.get('query');
    const excludeId = url.searchParams.get('excludeId');

    if (!entityType || !query) {
      return NextResponse.json(
        { error: 'Missing required parameters: entityType, query' },
        { status: 400 }
      );
    }

    const searchQuery = query.trim();
    const excludeIdNum = excludeId ? parseInt(excludeId) : null;

    let results = [];

    if (entityType === 'campaign') {
      const campaigns = await prisma.campaign.findMany({
        where: {
          AND: [
            {
              name: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              status: { in: ['active', 'pending_review'] } // Don't include archived or merged
            },
            excludeIdNum ? { id: { not: excludeIdNum } } : {}
          ]
        },
        include: {
          range: true,
          _count: {
            select: {
              gamePlans: true
            }
          }
        },
        orderBy: [
          { status: 'desc' }, // Active first
          { name: 'asc' }
        ],
        take: 20 // Limit results
      });

      results = campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        usageCount: campaign._count.gamePlans,
        relatedRange: campaign.range?.name || null,
        createdBy: campaign.createdBy
      }));

    } else if (entityType === 'range') {
      const ranges = await prisma.range.findMany({
        where: {
          AND: [
            {
              name: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              status: { in: ['active', 'pending_review'] } // Don't include archived or merged
            },
            excludeIdNum ? { id: { not: excludeIdNum } } : {}
          ]
        },
        include: {
          campaigns: {
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
        orderBy: [
          { status: 'desc' }, // Active first
          { name: 'asc' }
        ],
        take: 20 // Limit results
      });

      results = ranges.map(range => ({
        id: range.id,
        name: range.name,
        status: range.status,
        usageCount: range.campaigns.reduce((sum, campaign) => sum + campaign._count.gamePlans, 0),
        campaignsCount: range.campaigns.length,
        relatedCategories: range.categories.map(c => c.category.name),
        createdBy: range.createdBy
      }));
    } else {
      return NextResponse.json(
        { error: `Unknown entity type: ${entityType}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      results,
      query: searchQuery,
      entityType,
      count: results.length
    });

  } catch (error) {
    console.error('Error searching entities:', error);
    return NextResponse.json(
      { error: 'Failed to search entities' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}