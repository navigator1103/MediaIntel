import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { countryId, businessUnitId, mediaType, data } = await request.json();

    console.log('Save request received:', { countryId, businessUnitId, mediaType, dataLength: data?.length });
    console.log('Sample data record:', data?.[0]);

    if (!countryId || !businessUnitId || !mediaType || !data) {
      return NextResponse.json({ 
        error: 'Country ID, Business Unit ID, media type, and data are required' 
      }, { status: 400 });
    }

    // Validate media type
    if (!['tv', 'digital'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    console.log(`Saving ${mediaType} SOV data for country ${countryId}, business unit ${businessUnitId}`);
    console.log(`Received ${data.length} records`);

    // Clear existing data for this country/business unit combination
    // This ensures we replace all data, not just append
    const deleteResult = await prisma.shareOfVoice.deleteMany({
      where: {
        countryId: parseInt(countryId),
        businessUnitId: parseInt(businessUnitId)
      }
    });
    
    console.log(`Deleted ${deleteResult.count} existing SOV records`);

    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Data cleared successfully',
        savedRecords: 0,
        deletedRecords: deleteResult.count
      });
    }

    // Group data by category first, then assign positions based on intended order
    const categorizedData = new Map<string, any[]>();
    
    // Group by category
    data.forEach((row: any) => {
      if (!categorizedData.has(row.category)) {
        categorizedData.set(row.category, []);
      }
      categorizedData.get(row.category)!.push(row);
    });
    
    // Remove duplicates within each category (keep first occurrence)
    categorizedData.forEach((rows, category) => {
      const uniqueRows = [];
      const seenCompanies = new Set<string>();
      
      for (const row of rows) {
        if (!seenCompanies.has(row.company)) {
          seenCompanies.add(row.company);
          uniqueRows.push(row);
        }
      }
      categorizedData.set(category, uniqueRows);
    });
    
    // Transform and validate data with correct position information
    const transformedData: any[] = [];
    
    categorizedData.forEach((rows, category) => {
      rows.forEach((row: any, positionInCategory: number) => {
        const record: any = {
          countryId: parseInt(countryId),
          businessUnitId: parseInt(businessUnitId),
          category: row.category?.trim(),
          company: row.company?.trim(),
          position: positionInCategory, // Position within this category (0, 1, 2...)
          uploadedBy: 'admin', // This should come from user context
          uploadSession: `grid-${Date.now()}` // Generate a session ID for tracking
        };

      // Add TV or Digital fields based on media type
      if (mediaType === 'tv') {
        record.totalTvInvestment = row.totalTvInvestment ? parseFloat(row.totalTvInvestment) : null;
        record.totalTvTrps = row.totalTvTrps ? parseFloat(row.totalTvTrps) : null;
        record.totalDigitalSpend = null;
        record.totalDigitalImpressions = null;
      } else {
        record.totalDigitalSpend = row.totalDigitalSpend ? parseFloat(row.totalDigitalSpend) : null;
        record.totalDigitalImpressions = row.totalDigitalImpressions ? parseFloat(row.totalDigitalImpressions) : null;
        record.totalTvInvestment = null;
        record.totalTvTrps = null;
      }

        // Validate required fields
        if (!record.category || !record.company) {
          throw new Error(`Invalid record: category and company are required`);
        }

        transformedData.push(record);
      });
    });
    
    console.log('=== POSITION CALCULATION DEBUG ===');
    console.log('Categories processed:', Array.from(categorizedData.keys()));
    categorizedData.forEach((rows, category) => {
      console.log(`${category}: ${rows.map((r, i) => `${i}:${r.company}`).join(', ')}`);
    });

    // Save data using individual upserts to handle unique constraints properly
    let savedCount = 0;

    for (const record of transformedData) {
      try {
        // Use findFirst + create/update approach since position constraint might not be ready
        const existing = await prisma.shareOfVoice.findFirst({
          where: {
            countryId: record.countryId,
            businessUnitId: record.businessUnitId,
            category: record.category,
            position: record.position
          }
        });

        if (existing) {
          // Update existing record
          await prisma.shareOfVoice.update({
            where: { id: existing.id },
            data: {
              company: record.company,
              totalTvInvestment: record.totalTvInvestment,
              totalTvTrps: record.totalTvTrps,
              totalDigitalSpend: record.totalDigitalSpend,
              totalDigitalImpressions: record.totalDigitalImpressions,
              uploadedBy: record.uploadedBy,
              uploadSession: record.uploadSession
            }
          });
        } else {
          // Create new record
          await prisma.shareOfVoice.create({
            data: record
          });
        }
        
        savedCount++;
        
        if (savedCount % 50 === 0) {
          console.log(`Saved: ${savedCount}/${transformedData.length}`);
        }
      } catch (error) {
        console.error(`Error saving record for ${record.category}-${record.company}:`, error);
        throw error;
      }
    }

    console.log(`Successfully saved ${savedCount} ${mediaType} SOV records`);

    return NextResponse.json({
      success: true,
      savedRecords: savedCount,
      totalRecords: data.length,
      deletedRecords: deleteResult.count,
      mediaType,
      message: `Successfully saved ${savedCount} ${mediaType.toUpperCase()} SOV records`
    });

  } catch (error: any) {
    console.error('Error saving SOV data:', error);
    return NextResponse.json({
      error: 'Failed to save SOV data',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}