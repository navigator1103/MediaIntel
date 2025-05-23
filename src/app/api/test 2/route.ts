import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ message: 'API is working' });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Test endpoint failed' },
      { status: 500 }
    );
  }
}
