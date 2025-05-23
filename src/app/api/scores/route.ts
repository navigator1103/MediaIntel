import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/scores - Get all scores with filtering options
export async function GET(request: NextRequest) {
  try {
    // First, ensure we have the latest country data
    await refreshCountryData();
    
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const countryId = searchParams.get('countryId');
    const brandId = searchParams.get('brandId');
    const ruleId = searchParams.get('ruleId');
    const month = searchParams.get('month');
    const limit = searchParams.get('limit');
    
    console.log('API: Received filter parameters:', { 
      platform: platform || 'not provided', 
      countryId: countryId || 'not provided', 
      brandId: brandId || 'not provided', 
      ruleId: ruleId || 'not provided', 
      month: month || 'not provided', 
      limit: limit || 'not provided' 
    });
    
    // Build filter object based on query parameters
    const filter: any = {};
    
    // Only add filters if they have valid values
    if (platform && platform.trim() !== '') {
      // Add detailed logging for platform filtering
      console.log(`API: Processing platform filter value: "${platform}"`);
      
      // Handle platform filtering with special cases
      if (platform.toLowerCase() === 'dv360') {
        console.log('API: Converting DV360 to Google DV360 for database compatibility');
        filter.platform = 'Google DV360';
      } else if (platform === 'Google DV360') {
        filter.platform = 'Google DV360';
      } else {
        filter.platform = platform;
      }
      
      console.log(`API: Final platform filter value: "${filter.platform}"`);
    }
    
    if (countryId && countryId.trim() !== '') {
      const parsedCountryId = parseInt(countryId);
      if (!isNaN(parsedCountryId)) {
        filter.countryId = parsedCountryId;
        console.log(`API: Adding country filter: ${parsedCountryId}`);
      } else {
        console.log(`API: Invalid country ID: ${countryId}`);
      }
    }
    
    if (brandId && brandId.trim() !== '') {
      const parsedBrandId = parseInt(brandId);
      if (!isNaN(parsedBrandId)) {
        filter.brandId = parsedBrandId;
        console.log(`API: Adding brand filter: ${parsedBrandId}`);
      } else {
        console.log(`API: Invalid brand ID: ${brandId}`);
      }
    }
    
    if (ruleId && ruleId.trim() !== '') {
      const parsedRuleId = parseInt(ruleId);
      if (!isNaN(parsedRuleId)) {
        filter.ruleId = parsedRuleId;
        console.log(`API: Adding rule filter: ${parsedRuleId}`);
      } else {
        console.log(`API: Invalid rule ID: ${ruleId}`);
      }
    }
    
    if (month && month.trim() !== '') {
      filter.month = month;
      console.log(`API: Adding month filter: ${month}`);
    }
    
    console.log('API: Using filter criteria:', JSON.stringify(filter, null, 2));
    
    // Fetch scores from database
    let scores = await prisma.score.findMany({
      where: filter,
      include: {
        rule: true,
        country: true,
        brand: true
      },
      orderBy: {
        id: 'desc'
      },
      ...(limit ? { take: parseInt(limit) } : {})
    });
    
    // Log the countries found in the scores
    const countriesInScores = scores.map(score => ({
      id: score.countryId,
      name: score.country?.name || 'Unknown'
    }));
    
    console.log('API: Countries in scores:', JSON.stringify([...new Map(countriesInScores.map(c => [c.id, c])).values()], null, 2));
    
    console.log(`API: Found ${scores.length} scores matching criteria`);
    
    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify(scores), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/scores - Create a new score
export async function POST(request: NextRequest) {
  try {
    // First, ensure we have the latest country data
    await refreshCountryData();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['ruleId', 'platform', 'countryId', 'brandId', 'score', 'month'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Convert string IDs to numbers if needed
    const data = {
      ruleId: typeof body.ruleId === 'string' ? parseInt(body.ruleId) : body.ruleId,
      platform: body.platform,
      countryId: typeof body.countryId === 'string' ? parseInt(body.countryId) : body.countryId,
      brandId: typeof body.brandId === 'string' ? parseInt(body.brandId) : body.brandId,
      score: typeof body.score === 'string' ? parseInt(body.score) : body.score,
      trend: body.trend !== undefined ? (typeof body.trend === 'string' ? parseInt(body.trend) : body.trend) : 0,
      month: body.month,
      evaluation: body.evaluation || 'NA'
    };
    
    const score = await prisma.score.create({
      data,
      include: {
        rule: true,
        country: true,
        brand: true
      }
    });
    
    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    console.error('Error creating score:', error);
    return NextResponse.json(
      { error: 'Failed to create score' },
      { status: 500 }
    );
  }
}

// Helper function to refresh country data
async function refreshCountryData() {
  try {
    // Force update to ensure old countries are removed
    const forceUpdate = true;
    
    // Fetch the latest country data from the admin API using relative URL
    // This prevents issues when the app is running on different ports
    const url = forceUpdate 
      ? '/api/admin/countries?forceUpdate=true' 
      : '/api/admin/countries';
      
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to refresh country data:', await response.text());
    } else {
      const data = await response.json();
      console.log(`Country data refreshed successfully. Found ${data.length} countries.`);
      
      // Log the countries for debugging
      console.log('Available countries:', data.map(c => `${c.name} (ID: ${c.id})`).join(', '));
    }
  } catch (error) {
    console.error('Error refreshing country data:', error);
  }
}
