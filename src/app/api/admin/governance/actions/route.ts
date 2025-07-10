import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Perform governance actions (approve, archive, merge)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entityType, entityId, entityIds, reviewedBy, notes, mergeIntoId } = body;

    if (!action || !entityType || (!entityId && !entityIds) || !reviewedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: action, entityType, entityId/entityIds, reviewedBy' },
        { status: 400 }
      );
    }

    const now = new Date();
    const ids = entityIds || [entityId];
    const results = [];

    for (const id of ids) {
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        results.push({ id, error: 'Invalid ID format' });
        continue;
      }

      try {
        let result;

        if (entityType === 'campaign') {
          switch (action) {
            case 'approve':
              result = await prisma.campaign.update({
                where: { id: numericId },
                data: {
                  status: 'active',
                  reviewedBy,
                  reviewedAt: now,
                  notes: notes || 'Approved by admin'
                }
              });
              break;

            case 'archive':
              result = await prisma.campaign.update({
                where: { id: numericId },
                data: {
                  status: 'archived',
                  reviewedBy,
                  reviewedAt: now,
                  notes: notes || 'Archived by admin'
                }
              });
              break;

            case 'merge':
              if (!mergeIntoId) {
                results.push({ id, error: 'mergeIntoId required for merge action' });
                continue;
              }

              // Update all game plans to use the target campaign
              await prisma.gamePlan.updateMany({
                where: { campaignId: numericId },
                data: { campaignId: parseInt(mergeIntoId) }
              });

              // Mark the original campaign as merged
              result = await prisma.campaign.update({
                where: { id: numericId },
                data: {
                  status: 'merged',
                  mergedInto: parseInt(mergeIntoId),
                  reviewedBy,
                  reviewedAt: now,
                  notes: notes || `Merged into campaign ID ${mergeIntoId}`
                }
              });
              break;

            default:
              results.push({ id, error: `Unknown action: ${action}` });
              continue;
          }
        } else if (entityType === 'range') {
          switch (action) {
            case 'approve':
              result = await prisma.range.update({
                where: { id: numericId },
                data: {
                  status: 'active',
                  reviewedBy,
                  reviewedAt: now,
                  notes: notes || 'Approved by admin'
                }
              });
              break;

            case 'archive':
              result = await prisma.range.update({
                where: { id: numericId },
                data: {
                  status: 'archived',
                  reviewedBy,
                  reviewedAt: now,
                  notes: notes || 'Archived by admin'
                }
              });
              break;

            case 'merge':
              if (!mergeIntoId) {
                results.push({ id, error: 'mergeIntoId required for merge action' });
                continue;
              }

              // Update all campaigns that use this range
              await prisma.campaign.updateMany({
                where: { rangeId: numericId },
                data: { rangeId: parseInt(mergeIntoId) }
              });

              // Mark the original range as merged
              result = await prisma.range.update({
                where: { id: numericId },
                data: {
                  status: 'merged',
                  mergedInto: parseInt(mergeIntoId),
                  reviewedBy,
                  reviewedAt: now,
                  notes: notes || `Merged into range ID ${mergeIntoId}`
                }
              });
              break;

            default:
              results.push({ id, error: `Unknown action: ${action}` });
              continue;
          }
        } else {
          results.push({ id, error: `Unknown entity type: ${entityType}` });
          continue;
        }

        results.push({ 
          id, 
          success: true, 
          action, 
          entityType,
          status: result.status 
        });

      } catch (error) {
        console.error(`Error processing ${action} for ${entityType} ${id}:`, error);
        results.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processedCount: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => r.error).length
    });

  } catch (error) {
    console.error('Error performing governance actions:', error);
    return NextResponse.json(
      { error: 'Failed to perform governance actions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}