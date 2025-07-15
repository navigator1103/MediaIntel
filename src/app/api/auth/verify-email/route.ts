import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/verify-email - Verify email with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Email verification attempt with token:', body.token);
    
    // Validate required fields
    if (!body.token) {
      console.log('No token provided');
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Find user with verification token
    console.log('Looking for user with verification token...');
    const user = await prisma.user.findUnique({
      where: { verificationToken: body.token }
    });
    
    if (!user) {
      console.log('No user found with token:', body.token);
      
      // Check if any user has this token format
      const allUsers = await prisma.user.findMany({
        where: {
          verificationToken: {
            not: null
          }
        },
        select: {
          id: true,
          email: true,
          verificationToken: true,
          emailVerified: true
        }
      });
      
      console.log('Users with verification tokens:', allUsers);
      
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }
    
    console.log('Found user:', { id: user.id, email: user.email, emailVerified: user.emailVerified });
    
    // Check if already verified
    if (user.emailVerified) {
      console.log('User already verified');
      return NextResponse.json({
        message: 'Email already verified! You can now login.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true
        }
      });
    }
    
    // Update user to mark email as verified
    console.log('Marking user as verified...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null // Clear the token after use
      }
    });
    
    console.log('Email verification successful for user:', user.email);
    
    return NextResponse.json({
      message: 'Email verified successfully! You can now login.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('Error during email verification:', error);
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 500 }
    );
  }
}