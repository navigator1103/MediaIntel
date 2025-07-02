import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch game plans with related data
    const gamePlans = await prisma.gamePlan.findMany({
      include: {
        campaign: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        country: true,
        pmType: true,
        // Use a type assertion to handle the category relation
        // that might not be fully recognized in the TypeScript types yet
        ...({
          // @ts-ignore - Handle the case where category might not be in the type yet
          category: true
        })
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Enhance the response with category information from the category_id field
    // if the relation isn't properly loaded
    const enhancedGamePlans = await Promise.all(gamePlans.map(async (plan) => {
      // @ts-ignore - Handle the case where category might not be in the type yet
      if (!plan.category && plan.category_id) {
        try {
          // @ts-ignore - Handle the case where category might not be in the type yet
          const category = await prisma.category.findUnique({
            where: { id: plan.category_id }
          });
          
          // @ts-ignore - Handle the case where category might not be in the type yet
          return { ...plan, category };
        } catch (err) {
          console.error('Error fetching category for game plan:', err);
          return plan;
        }
      }
      return plan;
    }));

    return NextResponse.json(enhancedGamePlans);
  } catch (error) {
    console.error('Error fetching game plans data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game plans data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { gamePlans } = await request.json();
    
    if (!Array.isArray(gamePlans) || gamePlans.length === 0) {
      return NextResponse.json(
        { error: 'Invalid game plans data' },
        { status: 400 }
      );
    }
    
    // Process updates in sequence
    const results = [];
    
    for (const plan of gamePlans) {
      // Extract only the fields that can be updated directly
      // Exclude nested objects and relations
      const {
        id,
        burst,
        startDate,
        endDate,
        totalBudget,
        q1Budget,
        q2Budget,
        q3Budget,
        q4Budget,
        trps,
        reach1Plus,
        reach3Plus,
        totalWoa,
        weeksOffAir,
        year,
        playbook_id,
        // Add other editable fields here
      } = plan;
      
      if (!id) continue; // Skip items without ID
      
      try {
        const updatedPlan = await prisma.gamePlan.update({
          where: { id },
          data: {
            burst,
            startDate,
            endDate,
            totalBudget,
            q1Budget,
            q2Budget,
            q3Budget,
            q4Budget,
            trps,
            reach1Plus,
            reach3Plus,
            totalWoa,
            weeksOffAir,
            year,
            playbook_id,
            // Add other editable fields here
          },
        });
        
        results.push({
          id,
          success: true,
          data: updatedPlan,
        });
      } catch (error) {
        console.error(`Error updating game plan ${id}:`, error);
        results.push({
          id,
          success: false,
          error: 'Failed to update game plan',
        });
      }
    }
    
    return NextResponse.json({
      message: 'Game plans updated',
      results,
    });
  } catch (error) {
    console.error('Error updating game plans:', error);
    return NextResponse.json(
      { error: 'Failed to update game plans' },
      { status: 500 }
    );
  }
}
