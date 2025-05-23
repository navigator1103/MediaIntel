import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Function to log with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Function to log errors with timestamp
function logErrorWithTimestamp(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] ERROR: ${message}`, error);
  } else {
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Log database path
    const dbPath = path.join(process.cwd(), 'prisma', 'golden_rules.db');
    logWithTimestamp(`Database path: ${dbPath}`);
    
    // Check if database file exists
    const dbExists = fs.existsSync(dbPath);
    logWithTimestamp(`Database file exists: ${dbExists}`);
    
    // Initialize Prisma client with explicit database URL
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`,
        },
      },
    });
    
    // Test database connection
    logWithTimestamp('Testing database connection...');
    
    // Try to query a simple table
    const userCount = await prisma.user.count();
    logWithTimestamp(`User count: ${userCount}`);
    
    // List all tables in the database
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    
    // Disconnect from database
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      dbPath,
      dbExists,
      userCount,
      tables
    });
  } catch (error) {
    logErrorWithTimestamp('Error testing database connection:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
