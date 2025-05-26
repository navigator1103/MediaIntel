import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/getUserFromToken';

// GET /api/change-requests - Get all change requests with filtering options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scoreId = searchParams.get('scoreId');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const countryId = searchParams.get('countryId');
    const brandId = searchParams.get('brandId');
    const platform = searchParams.get('platform');
    const limit = searchParams.get('limit');
    const timeframe = searchParams.get('timeframe');
    
    console.log('API: Received change request filter parameters:', { 
      scoreId, status, month, countryId, brandId, platform, limit, timeframe 
    });
    
    // Build filter object based on query parameters
    const filter: any = {};
    if (scoreId) {
      try {
        filter.scoreId = parseInt(scoreId);
      } catch (e) {
        console.error('Invalid scoreId parameter:', scoreId);
      }
    }
    if (status) filter.status = status;
    
    // Handle timeframe filtering
    if (timeframe) {
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          // Start of current week (Sunday)
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          // Start of current month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          // Start of current quarter
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterMonth, 1);
          break;
        case 'year':
          // Start of current year
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          // No timeframe filter
          startDate = new Date(0); // Jan 1, 1970
      }
      
      console.log(`API: Filtering change requests from ${startDate.toISOString()} for timeframe: ${timeframe}`);
      
      filter.createdAt = {
        gte: startDate
      };
    }
    
    // Build score filter for related scores
    const scoreFilter: any = {};
    if (month) scoreFilter.month = month;
    if (countryId) {
      try {
        scoreFilter.countryId = parseInt(countryId);
      } catch (e) {
        console.error('Invalid countryId parameter:', countryId);
      }
    }
    if (brandId) {
      try {
        scoreFilter.brandId = parseInt(brandId);
      } catch (e) {
        console.error('Invalid brandId parameter:', brandId);
      }
    }
    if (platform) scoreFilter.platform = platform;
    
    // Add score filter if any score-related filters are present
    if (Object.keys(scoreFilter).length > 0) {
      filter.score = {
        is: scoreFilter
      };
    }
    
    console.log('API: Using change request filter criteria:', filter);
    
    // Get basic change requests first
    const basicChangeRequests = await prisma.changeRequest.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit && !isNaN(parseInt(limit)) ? { take: parseInt(limit) } : {})
    });
    
    console.log(`API: Found ${basicChangeRequests.length} change requests matching criteria`);
    
    // Process each change request to add related data
    const processedRequests = [];
    
    for (const request of basicChangeRequests) {
      try {
        // Create a base request object
        const processedRequest: any = { ...request };
        
        // Try to fetch score data if scoreId exists
        if (request.scoreId) {
          try {
            const score = await prisma.score.findUnique({
              where: { id: request.scoreId },
            });
            
            if (score) {
              processedRequest.score = score;
              
              // Fetch related rule if score exists
              if (score.ruleId) {
                try {
                  const rule = await prisma.rule.findUnique({
                    where: { id: score.ruleId }
                  });
                  if (rule) {
                    processedRequest.score.rule = rule;
                  }
                } catch (ruleError) {
                  console.error(`Error fetching rule for score ${score.id}:`, ruleError);
                }
              }
              
              // Fetch related country if score exists
              if (score.countryId) {
                try {
                  const country = await prisma.country.findUnique({
                    where: { id: score.countryId }
                  });
                  if (country) {
                    processedRequest.score.country = country;
                  }
                } catch (countryError) {
                  console.error(`Error fetching country for score ${score.id}:`, countryError);
                }
              }
              
              // Fetch related brand if score exists
              if (score.brandId) {
                try {
                  const brand = await prisma.brand.findUnique({
                    where: { id: score.brandId }
                  });
                  if (brand) {
                    processedRequest.score.brand = brand;
                  }
                } catch (brandError) {
                  console.error(`Error fetching brand for score ${score.id}:`, brandError);
                }
              }
            }
          } catch (scoreError) {
            console.error(`Error fetching score for change request ${request.id}:`, scoreError);
          }
        }
        
        // Try to fetch user data if userId exists
        if ('userId' in request && request.userId) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: request.userId },
              select: {
                id: true,
                name: true,
                email: true
              }
            });
            if (user) {
              processedRequest.user = user;
            }
          } catch (userError) {
            console.error(`Error fetching user for change request ${request.id}:`, userError);
            // User relation might not exist in schema, continue without it
          }
        }
        
        processedRequests.push(processedRequest);
      } catch (requestError) {
        console.error(`Error processing change request ${request.id}:`, requestError);
        // Include the basic request anyway
        processedRequests.push(request);
      }
    }
    
    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify(processedRequests), {
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
    console.error('Error fetching change requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change requests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/change-requests - Create a new change request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['scoreId', 'requestedScore', 'comments'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Try to get the user from the token
    const user = getUserFromToken(request);
    console.log('User from token:', user);
    
    // Convert string IDs to numbers if needed
    const data = {
      scoreId: typeof body.scoreId === 'string' ? parseInt(body.scoreId) : body.scoreId,
      requestedScore: typeof body.requestedScore === 'string' ? parseInt(body.requestedScore) : body.requestedScore,
      comments: body.comments,
      // Add userId from the token if available, otherwise use the one from the request if provided
      ...(user ? { userId: user.id } : {}),
      // If no user from token but userId provided in request, use that
      ...(!user && body.userId ? { userId: typeof body.userId === 'string' ? parseInt(body.userId) : body.userId } : {}),
      // Ensure we use the correct status terminology
      status: body.status || 'Submitted for Review'
    };
    
    console.log('Creating change request with data:', data);
    
    // Validate status if provided
    if (body.status && !['Submitted for Review', 'Approved', 'Rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: Submitted for Review, Approved, Rejected' },
        { status: 400 }
      );
    }
    
    // Check if score exists
    const score = await prisma.score.findUnique({
      where: { id: data.scoreId }
    });
    
    if (!score) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }
    
    // Check if there's already a pending change request for this score
    const existingRequest = await prisma.changeRequest.findFirst({
      where: {
        scoreId: data.scoreId,
        status: 'Submitted for Review'
      }
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'A change request for this rule is already pending review' },
        { status: 400 }
      );
    }
    
    // Create the change request and update the score status in a transaction
    const changeRequest = await prisma.$transaction(async (tx) => {
      // Create the change request
      const newRequest = await tx.changeRequest.create({
        data,
        include: {
          score: {
            include: {
              rule: true,
              country: true,
              brand: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      // Update the score status to indicate a change request is in progress
      await tx.score.update({
        where: { id: data.scoreId },
        data: { status: 'Submitted for Review' }
      });
      
      return newRequest;
    });
    
    // Ensure the user property exists even if null
    const normalizedChangeRequest = {
      ...changeRequest,
      user: changeRequest.user || null
    };
    
    // Set cache control headers to prevent caching
    return new NextResponse(JSON.stringify(normalizedChangeRequest), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error creating change request:', error);
    return NextResponse.json(
      { error: 'Failed to create change request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
