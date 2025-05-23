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
