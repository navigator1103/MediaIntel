import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify auth setup
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Auth system configured',
    timestamp: new Date().toISOString(),
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL
  });
}