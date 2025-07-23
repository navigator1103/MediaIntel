import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, createCountryWhereClause } from '@/lib/auth/countryAccess';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('[2025-07-22T18:28:59.622Z] Media Sufficiency Management API route loaded');
    
    // Get user access information for country filtering
    const userAccess = await getUserFromRequest(request);
    console.log('Media Sufficiency Management API - User access:', userAccess);
    
    // Build where clause with country filtering
    let whereClause: any = {};
    if (userAccess) {
      const countryFilter = createCountryWhereClause(userAccess);
      Object.assign(whereClause, countryFilter);
      console.log('Media Sufficiency Management API - Applied country filter:', countryFilter);
    }
    
    // Get all media sufficiency records with related data
    const mediaSufficiencyData = await prisma.mediaSufficiency.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${mediaSufficiencyData.length} media sufficiency records`);

    // Transform the data for display
    const transformedData = mediaSufficiencyData.map(item => ({
      id: item.id,
      lastUpdate: item.lastUpdate,
      subRegion: item.subRegion,
      country: item.country,
      category: item.category,
      range: item.range,
      campaign: item.campaign,
      bu: item.bu,
      // TV data
      finalTvTarget: item.finalTvTarget,
      tvTargetSize: item.tvTargetSize,
      tvPlannedR1Plus: item.tvPlannedR1Plus,
      tvPlannedR3Plus: item.tvPlannedR3Plus,
      tvPotentialR1Plus: item.tvPotentialR1Plus,
      // Digital data
      finalDigitalTarget: item.finalDigitalTarget,
      digitalTargetSizeAbs: item.digitalTargetSizeAbs,
      digitalPlannedR1Plus: item.digitalPlannedR1Plus,
      digitalPotentialR1Plus: item.digitalPotentialR1Plus,
      // Combined metrics
      plannedCombinedReach: item.plannedCombinedReach,
      combinedPotentialReach: item.combinedPotentialReach,
      // Demographics
      tvDemoGender: item.tvDemoGender,
      tvDemoMinAge: item.tvDemoMinAge,
      tvDemoMaxAge: item.tvDemoMaxAge,
      digitalDemoGender: item.digitalDemoGender,
      digitalDemoMinAge: item.digitalDemoMinAge,
      digitalDemoMaxAge: item.digitalDemoMaxAge,
      // Cost data
      cpp2024: item.cpp2024,
      cpp2025: item.cpp2025,
      cpp2026: item.cpp2026,
      reportedCurrency: item.reportedCurrency,
      // Meta
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Error fetching media sufficiency data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media sufficiency data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty IDs array' },
        { status: 400 }
      );
    }

    console.log(`Deleting media sufficiency records with IDs: ${ids.join(', ')}`);

    // Get user access information for country filtering
    const userAccess = await getUserFromRequest(request);
    console.log('Media Sufficiency DELETE API - User access:', userAccess);
    
    // Build where clause with country filtering AND id filtering
    let whereClause: any = {
      id: {
        in: ids
      }
    };
    
    if (userAccess) {
      const countryFilter = createCountryWhereClause(userAccess);
      Object.assign(whereClause, countryFilter);
      console.log('Media Sufficiency DELETE API - Applied country filter:', countryFilter);
    }

    // Delete the records (only those the user has access to)
    const deleteResult = await prisma.mediaSufficiency.deleteMany({
      where: whereClause
    });

    console.log(`Successfully deleted ${deleteResult.count} media sufficiency records`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} record(s)`
    });

  } catch (error) {
    console.error('Error deleting media sufficiency records:', error);
    return NextResponse.json(
      { error: 'Failed to delete records' },
      { status: 500 }
    );
  }
}