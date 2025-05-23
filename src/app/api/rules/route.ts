import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rules - Get all rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    // Build filter object based on query parameters
    const filter: any = {};
    if (platform) filter.platform = platform;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    const rules = await prisma.rule.findMany({
      where: filter,
      orderBy: {
        id: 'asc'
      }
    });
    
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

// POST /api/rules - Create a new rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['platform', 'title', 'description', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const rule = await prisma.rule.create({
      data: {
        platform: body.platform,
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status || 'active',
        priority: body.priority || 'medium'
      }
    });
    
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}
