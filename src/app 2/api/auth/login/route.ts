import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For demo purposes, only allow hardcoded credentials
    if (email === 'admin@example.com' && password === 'admin') {
      return NextResponse.json({
        token: 'demo-admin-token',
        user: {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        }
      });
    } else if (email === 'user@example.com' && password === 'user') {
      return NextResponse.json({
        token: 'demo-user-token',
        user: {
          id: 2,
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
        }
      });
    }

    // If credentials don't match, return error
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
