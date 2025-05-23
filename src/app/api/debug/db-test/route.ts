import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Mark this route as not requiring authentication
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to handle BigInt serialization
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = serializeData(data[key]);
    }
    return result;
  }
  
  return data;
}

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Database connection test:', connectionTest);
    
    // Get database path
    const dbPath = await prisma.$queryRaw`PRAGMA database_list`;
    console.log('Database path:', dbPath);
    
    // Get list of tables
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('Tables in database:', tables);
    
    // Count records in key tables
    const taxonomyCount = await prisma.taxonomyScore.count();
    const countriesCount = await prisma.country.count();
    const brandsCount = await prisma.brand.count();
    
    // Try to directly query the taxonomy_scores table
    const directTaxonomyCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM taxonomy_scores`;
    
    // Get a sample of taxonomy scores
    const sampleScores = await prisma.taxonomyScore.findMany({
      take: 5,
      include: {
        country: true,
        brand: true
      }
    });
    
    // Serialize the data to handle BigInt values
    const responseData = {
      success: true,
      connection: 'OK',
      dbPath,
      tables,
      counts: {
        taxonomyScores: taxonomyCount,
        directTaxonomyCount,
        countries: countriesCount,
        brands: brandsCount
      },
      sampleScores,
      env: {
        databaseUrl: process.env.DATABASE_URL
      }
    };
    
    return NextResponse.json(serializeData(responseData));
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorObject: error
    }, { status: 500 });
  }
}
