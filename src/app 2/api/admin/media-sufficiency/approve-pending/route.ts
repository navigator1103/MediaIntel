import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize Prisma client
const prisma = new PrismaClient();

// Function to log with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Function to log errors with timestamp
function logErrorWithTimestamp(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] ERROR: ${message}`, error);
  } else {
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
}

// Helper function to convert month name to number
function getMonthNumber(monthName: string): number {
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  return months[monthName] || 0;
}

export async function POST(request: NextRequest) {
  logWithTimestamp('Approve pending data API called');
  
  try {
    // Get the pending data ID from the request body
    const body = await request.json();
    const { pendingDataId } = body;
    
    if (!pendingDataId) {
      logErrorWithTimestamp('No pending data ID provided');
      return NextResponse.json(
        { error: 'No pending data ID provided' },
        { status: 400 }
      );
    }
    
    logWithTimestamp(`Approving pending data with ID: ${pendingDataId}`);
    
    // Get the pending campaign data
    const pendingData = await prisma.pendingCampaignData.findUnique({
      where: { id: pendingDataId },
      include: {
        campaigns: {
          include: {
            mediaItems: true
          }
        }
      }
    });
    
    if (!pendingData) {
      logErrorWithTimestamp(`Pending data not found: ${pendingDataId}`);
      return NextResponse.json(
        { error: 'Pending data not found' },
        { status: 404 }
      );
    }
    
    // Start a transaction to ensure all data is moved atomically
    const result = await prisma.$transaction(async (tx) => {
      // Track created entities
      let campaignsCreated = 0;
      let mediaItemsCreated = 0;
      
      // Get the session data to access the actual records
      const sessionDir = path.join(process.cwd(), 'data', 'sessions');
      const sessionFilePath = path.join(sessionDir, `${pendingData.uploadSessionId}.json`);
      
      if (!fs.existsSync(sessionFilePath)) {
        throw new Error(`Session file not found: ${sessionFilePath}`);
      }
      
      // Read the session data
      const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
      const sessionData = JSON.parse(sessionDataRaw);
      
      // Get the records
      const records = sessionData.records || [];
      if (records.length === 0) {
        throw new Error('No records to import');
      }
      
      console.log(`Found ${records.length} records to import`);
      
      // Process unique campaigns by combining country, range, and year
      const uniqueCampaigns = new Map();
      
      // First pass: identify unique campaigns
      for (const record of records) {
        const campaignKey = `${record.Country}_${record.Range}_${record.Campaign}_${record.Year}`;
        
        if (!uniqueCampaigns.has(campaignKey)) {
          uniqueCampaigns.set(campaignKey, {
            name: record.Campaign,
            country: record.Country,
            range: record.Range,
            year: parseInt(record.Year),
            businessUnit: record['Business Unit'],
            mediaItems: []
          });
        }
        
        // Add media item to this campaign
        uniqueCampaigns.get(campaignKey).mediaItems.push({
          media: record.Media,
          mediaSubtype: record['Media Subtype'],
          startDate: record['Start Date'],
          endDate: record['End Date'],
          totalBudget: parseFloat(record.Budget) || 0,
          q1Budget: record['Q1 Budget'] ? parseFloat(record['Q1 Budget']) : null,
          q2Budget: record['Q2 Budget'] ? parseFloat(record['Q2 Budget']) : null,
          q3Budget: record['Q3 Budget'] ? parseFloat(record['Q3 Budget']) : null,
          q4Budget: record['Q4 Budget'] ? parseFloat(record['Q4 Budget']) : null,
          targetReach: record['Target Reach'] ? record['Target Reach'].replace(/,/g, '') : null,
          currentReach: record['Current Reach'] ? record['Current Reach'].replace(/,/g, '') : null,
          pmType: record['PM Type']
        });
      }
      
      console.log(`Found ${uniqueCampaigns.size} unique campaigns`);
      
      // Second pass: create campaigns and media items
      for (const [key, campaignData] of uniqueCampaigns.entries()) {
        try {
          // Find country ID
          const country = await tx.mSCountry.findFirst({
            where: { name: campaignData.country }
          });
          
          if (!country) {
            console.log(`Country not found: ${campaignData.country}`);
            continue;
          }
          
          // Find range ID
          const range = await tx.range.findFirst({
            where: { name: campaignData.range }
          });
          
          if (!range) {
            console.log(`Range not found: ${campaignData.range}`);
            continue;
          }
          
          // Find business unit ID (optional)
          let businessUnitId = null;
          if (campaignData.businessUnit) {
            const businessUnit = await tx.businessUnit.findFirst({
              where: { name: campaignData.businessUnit }
            });
            
            if (businessUnit) {
              businessUnitId = businessUnit.id;
            }
          }
          
          // Create the campaign
          const campaign = await tx.campaign.create({
            data: {
              name: campaignData.name,
              countryId: country.id,
              rangeId: range.id,
              businessUnitId,
              year: campaignData.year,
              burst: 1
            }
          });
          
          campaignsCreated++;
          console.log(`Created campaign: ${campaign.name} (ID: ${campaign.id})`);
          
          // Create media items for this campaign
          for (const mediaItem of campaignData.mediaItems) {
            try {
              // Find media type
              const mediaType = await tx.mediaType.findFirst({
                where: { name: mediaItem.media }
              });
              
              if (!mediaType) {
                console.log(`Media type not found: ${mediaItem.media}`);
                continue;
              }
              
              // Find media subtype
              const mediaSubtype = await tx.mediaSubtype.findFirst({
                where: { 
                  name: mediaItem.mediaSubtype,
                  mediaTypeId: mediaType.id
                }
              });
              
              if (!mediaSubtype) {
                console.log(`Media subtype not found: ${mediaItem.mediaSubtype}`);
                continue;
              }
              
              // Find PM type (optional)
              let pmTypeId = null;
              if (mediaItem.pmType) {
                const pmType = await tx.pMType.findFirst({
                  where: { name: mediaItem.pmType }
                });
                
                if (pmType) {
                  pmTypeId = pmType.id;
                }
              }
              
              // Parse dates
              const startDateParts = mediaItem.startDate.split('-');
              const endDateParts = mediaItem.endDate.split('-');
              
              // Format: DD-MMM-YY
              const startDate = new Date(
                parseInt(`20${startDateParts[2]}`), // Year
                getMonthNumber(startDateParts[1]), // Month
                parseInt(startDateParts[0]) // Day
              );
              
              const endDate = new Date(
                parseInt(`20${endDateParts[2]}`), // Year
                getMonthNumber(endDateParts[1]), // Month
                parseInt(endDateParts[0]) // Day
              );
              
              // Create the campaign media
              const campaignMedia = await tx.campaignMedia.create({
                data: {
                  campaignId: campaign.id,
                  mediaSubtypeId: mediaSubtype.id,
                  pmTypeId,
                  startDate,
                  endDate,
                  totalBudget: mediaItem.totalBudget,
                  q1Budget: mediaItem.q1Budget,
                  q2Budget: mediaItem.q2Budget,
                  q3Budget: mediaItem.q3Budget,
                  q4Budget: mediaItem.q4Budget,
                  trps: null,
                  reach1Plus: mediaItem.targetReach ? parseFloat(mediaItem.targetReach) : null,
                  reach3Plus: mediaItem.currentReach ? parseFloat(mediaItem.currentReach) : null
                }
              });
              
              mediaItemsCreated++;
              console.log(`Created campaign media: ${mediaItem.mediaSubtype} (ID: ${campaignMedia.id})`);
            } catch (error) {
              console.log(`Error creating media item: ${error.message}`);
            }
          }
        } catch (error) {
          console.log(`Error creating campaign: ${error.message}`);
        }
      }
      
      // Update the pending campaign data status to approved
      await tx.pendingCampaignData.update({
        where: { id: pendingDataId },
        data: {
          status: 'approved',
          approvedAt: new Date()
        }
      });
      
      return {
        campaignsCreated,
        mediaItemsCreated
      };
    });
    
    logWithTimestamp('Approval process completed successfully', result);
    
    return result;
  } catch (error: any) {
    logErrorWithTimestamp(`Error approving pending import: ${error.message}`);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  logWithTimestamp('Get pending data API called');
  
  try {
    // Get all pending data
    const pendingData = await prisma.pendingCampaignData.findMany({
      where: {
        status: {
          in: ['pending', 'pending_with_errors']
        }
      },
      include: {
        campaigns: {
          include: {
            country: true,
            range: true,
            businessUnit: true,
            _count: {
              select: {
                mediaItems: true
              }
            }
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Return the pending data
    return NextResponse.json({
      success: true,
      pendingData
    });
    
  } catch (error) {
    logErrorWithTimestamp('Error getting pending data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  logWithTimestamp('Delete pending data API called');
  
  try {
    // Get the pending data ID from the request
    const { searchParams } = new URL(request.url);
    const pendingDataId = searchParams.get('id');
    
    if (!pendingDataId) {
      logErrorWithTimestamp('No pending data ID provided');
      return NextResponse.json(
        { error: 'No pending data ID provided' },
        { status: 400 }
      );
    }
    
    // Parse the ID as an integer
    const id = parseInt(pendingDataId);
    if (isNaN(id)) {
      logErrorWithTimestamp(`Invalid pending data ID: ${pendingDataId}`);
      return NextResponse.json(
        { error: 'Invalid pending data ID' },
        { status: 400 }
      );
    }
    
    logWithTimestamp(`Deleting pending data with ID: ${id}`);
    
    // Delete the pending data in a transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // First, delete all pending media items
      await tx.pendingCampaignMedia.deleteMany({
        where: {
          pendingCampaign: {
            pendingDataId: id
          }
        }
      });
      
      // Then, delete all pending campaigns
      await tx.pendingCampaign.deleteMany({
        where: {
          pendingDataId: id
        }
      });
      
      // Finally, delete the pending data
      await tx.pendingCampaignData.delete({
        where: {
          id
        }
      });
    });
    
    logWithTimestamp(`Pending data with ID ${id} deleted successfully`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Pending data deleted successfully'
    });
    
  } catch (error) {
    logErrorWithTimestamp('Error deleting pending data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
