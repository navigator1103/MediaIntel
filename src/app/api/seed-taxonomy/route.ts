import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This is a development-only endpoint, so we'll bypass authentication

export async function GET(request: NextRequest) {
  // Add a special development key for security
  const devKey = request.nextUrl.searchParams.get('devKey');
  if (devKey !== 'development-only') {
    return NextResponse.json({ error: 'Unauthorized. Use the development key.' }, { status: 401 });
  }
  try {
    console.log('Seeding taxonomy scores...');

    // Get all countries and brands
    const countries = await prisma.country.findMany();
    const brands = await prisma.brand.findMany();
    
    if (countries.length === 0) {
      return NextResponse.json({ error: 'No countries found. Please seed countries first.' }, { status: 400 });
    }
    
    if (brands.length === 0) {
      return NextResponse.json({ error: 'No brands found. Please seed brands first.' }, { status: 400 });
    }

    // Current month and previous month
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const results = [];

    // Platforms to use for seeding
    const platforms = ['Meta', 'Google Ads', 'TikTok', 'DV360'];
    
    // Generate random scores for each country, brand, and platform combination
    for (const country of countries) {
      // First create an entry for all brands and all platforms (null values)
      // Current month scores
      const l1Score = Math.floor(Math.random() * 100);
      const l2Score = Math.floor(Math.random() * 100);
      const l3Score = Math.floor(Math.random() * 100);
      const averageScore = Math.round((l1Score + l2Score + l3Score) / 3);

      // Check if score already exists
      const existingScore = await prisma.taxonomyScore.findFirst({
        where: {
          countryId: country.id,
          brandId: null,
          platform: null,
          month: currentMonth
        }
      });

      if (!existingScore) {
        const newScore = await prisma.taxonomyScore.create({
          data: {
            countryId: country.id,
            month: currentMonth,
            l1Score,
            l2Score,
            l3Score,
            averageScore
          }
        });
        results.push(`Created taxonomy score for ${country.name} (all brands, all platforms, ${currentMonth})`);
      } else {
        results.push(`Score already exists for ${country.name} (all brands, all platforms, ${currentMonth})`);
      }
      
      // Now create entries for each brand
      for (const brand of brands) {
        // Create entry for this brand with all platforms
        const brandL1Score = Math.floor(Math.random() * 100);
        const brandL2Score = Math.floor(Math.random() * 100);
        const brandL3Score = Math.floor(Math.random() * 100);
        const brandAverageScore = Math.round((brandL1Score + brandL2Score + brandL3Score) / 3);
        
        const existingBrandScore = await prisma.taxonomyScore.findFirst({
          where: {
            countryId: country.id,
            brandId: brand.id,
            platform: null,
            month: currentMonth
          }
        });
        
        if (!existingBrandScore) {
          const newBrandScore = await prisma.taxonomyScore.create({
            data: {
              countryId: country.id,
              brandId: brand.id,
              month: currentMonth,
              l1Score: brandL1Score,
              l2Score: brandL2Score,
              l3Score: brandL3Score,
              averageScore: brandAverageScore
            }
          });
          results.push(`Created taxonomy score for ${country.name}, ${brand.name} (all platforms, ${currentMonth})`);
        } else {
          results.push(`Score already exists for ${country.name}, ${brand.name} (all platforms, ${currentMonth})`);
        }
        
        // Create entries for each platform
        for (const platform of platforms) {
          const platformL1Score = Math.floor(Math.random() * 100);
          const platformL2Score = Math.floor(Math.random() * 100);
          const platformL3Score = Math.floor(Math.random() * 100);
          const platformAverageScore = Math.round((platformL1Score + platformL2Score + platformL3Score) / 3);
          
          const existingPlatformScore = await prisma.taxonomyScore.findFirst({
            where: {
              countryId: country.id,
              brandId: brand.id,
              platform: platform,
              month: currentMonth
            }
          });
          
          if (!existingPlatformScore) {
            const newPlatformScore = await prisma.taxonomyScore.create({
              data: {
                countryId: country.id,
                brandId: brand.id,
                platform: platform,
                month: currentMonth,
                l1Score: platformL1Score,
                l2Score: platformL2Score,
                l3Score: platformL3Score,
                averageScore: platformAverageScore
              }
            });
            results.push(`Created taxonomy score for ${country.name}, ${brand.name}, ${platform} (${currentMonth})`);
          } else {
            results.push(`Score already exists for ${country.name}, ${brand.name}, ${platform} (${currentMonth})`);
          }
        }
      }
      
      // Also create entries for each platform without a specific brand
      for (const platform of platforms) {
        const platformOnlyL1Score = Math.floor(Math.random() * 100);
        const platformOnlyL2Score = Math.floor(Math.random() * 100);
        const platformOnlyL3Score = Math.floor(Math.random() * 100);
        const platformOnlyAverageScore = Math.round((platformOnlyL1Score + platformOnlyL2Score + platformOnlyL3Score) / 3);
        
        const existingPlatformOnlyScore = await prisma.taxonomyScore.findFirst({
          where: {
            countryId: country.id,
            brandId: null,
            platform: platform,
            month: currentMonth
          }
        });
        
        if (!existingPlatformOnlyScore) {
          const newPlatformOnlyScore = await prisma.taxonomyScore.create({
            data: {
              countryId: country.id,
              platform: platform,
              month: currentMonth,
              l1Score: platformOnlyL1Score,
              l2Score: platformOnlyL2Score,
              l3Score: platformOnlyL3Score,
              averageScore: platformOnlyAverageScore
            }
          });
          results.push(`Created taxonomy score for ${country.name}, all brands, ${platform} (${currentMonth})`);
        } else {
          results.push(`Score already exists for ${country.name}, all brands, ${platform} (${currentMonth})`);
        }
      }

      // Previous month - just create the base records for simplicity
      const prevL1Score = Math.floor(Math.random() * 100);
      const prevL2Score = Math.floor(Math.random() * 100);
      const prevL3Score = Math.floor(Math.random() * 100);
      const prevAverageScore = Math.round((prevL1Score + prevL2Score + prevL3Score) / 3);

      // Check if score already exists
      const existingPrevScore = await prisma.taxonomyScore.findFirst({
        where: {
          countryId: country.id,
          brandId: null,
          platform: null,
          month: prevMonth
        }
      });

      if (!existingPrevScore) {
        const newPrevScore = await prisma.taxonomyScore.create({
          data: {
            countryId: country.id,
            month: prevMonth,
            l1Score: prevL1Score,
            l2Score: prevL2Score,
            l3Score: prevL3Score,
            averageScore: prevAverageScore
          }
        });
        results.push(`Created taxonomy score for ${country.name} (all brands, all platforms, ${prevMonth})`);
      } else {
        results.push(`Score already exists for ${country.name} (all brands, all platforms, ${prevMonth})`);
      }
    }

    console.log('Seeding completed successfully.');
    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    console.error('Error seeding taxonomy scores:', error);
    return NextResponse.json({ error: 'Failed to seed taxonomy scores' }, { status: 500 });
  }
}
