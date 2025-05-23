import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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

async function approvePendingImport(sessionId: string) {
  try {
    logWithTimestamp(`Starting approval process for session: ${sessionId}`);
    
    // Get the session data
    const sessionDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(sessionDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      throw new Error(`Session file not found: ${sessionFilePath}`);
    }
    
    // Read the session data
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // Check if the session has been validated
    if (sessionData.status !== 'validated') {
      throw new Error(`Session not validated: ${sessionId}`);
    }
    
    // Get the records
    const records = sessionData.records || [];
    if (records.length === 0) {
      throw new Error('No records to import');
    }
    
    logWithTimestamp(`Found ${records.length} records to import`);
    
    // Start a transaction to ensure all data is moved atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create a pending campaign data record if it doesn't exist
      let pendingData = await tx.pendingCampaignData.findFirst({
        where: { uploadSessionId: sessionId }
      });
      
      if (!pendingData) {
        pendingData = await tx.pendingCampaignData.create({
          data: {
            uploadSessionId: sessionId,
            status: 'pending',
            comments: `Imported from CSV on ${new Date().toISOString()}`
          }
        });
        logWithTimestamp(`Created pending campaign data record with ID: ${pendingData.id}`);
      } else {
        logWithTimestamp(`Found existing pending campaign data record with ID: ${pendingData.id}`);
      }
      
      // Track created entities
      let campaignsCreated = 0;
      let mediaItemsCreated = 0;
      
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
      
      logWithTimestamp(`Found ${uniqueCampaigns.size} unique campaigns`);
      
      // Second pass: create campaigns and media items
      for (const [key, campaignData] of uniqueCampaigns.entries()) {
        try {
          // Find country ID
          const country = await tx.mSCountry.findFirst({
            where: { name: campaignData.country }
          });
          
          if (!country) {
            logWithTimestamp(`Country not found: ${campaignData.country}`);
            continue;
          }
          
          // Find range ID
          const range = await tx.range.findFirst({
            where: { name: campaignData.range }
          });
          
          if (!range) {
            logWithTimestamp(`Range not found: ${campaignData.range}`);
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
          logWithTimestamp(`Created campaign: ${campaign.name} (ID: ${campaign.id})`);
          
          // Create media items for this campaign
          for (const mediaItem of campaignData.mediaItems) {
            try {
              // Find media type
              const mediaType = await tx.mediaType.findFirst({
                where: { name: mediaItem.media }
              });
              
              if (!mediaType) {
                logWithTimestamp(`Media type not found: ${mediaItem.media}`);
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
                logWithTimestamp(`Media subtype not found: ${mediaItem.mediaSubtype}`);
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
              logWithTimestamp(`Created campaign media: ${mediaItem.mediaSubtype} (ID: ${campaignMedia.id})`);
            } catch (error) {
              logWithTimestamp(`Error creating media item: ${error.message}`);
            }
          }
        } catch (error) {
          logWithTimestamp(`Error creating campaign: ${error.message}`);
        }
      }
      
      // Update the pending campaign data status to approved
      await tx.pendingCampaignData.update({
        where: { id: pendingData.id },
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
  } catch (error) {
    logWithTimestamp(`Error approving pending import: ${error.message}`);
    throw error;
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

// Get session ID from command line arguments
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('Please provide a session ID as an argument');
  process.exit(1);
}

// Run the approval process
approvePendingImport(sessionId)
  .then(result => {
    console.log('Import approved successfully:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error approving import:', error);
    process.exit(1);
  });
