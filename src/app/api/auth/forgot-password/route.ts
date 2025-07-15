import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken, getTokenExpiryDate } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email/sendgrid';

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });
    
    if (user) {
      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const expiresAt = getTokenExpiryDate(1); // 1 hour expiry
      
      // Store reset token in database
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt
        }
      });
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, resetToken);
      
      console.log(`Password reset email sent to: ${user.email}`);
    }
    
    // Always return success even if user doesn't exist (security best practice)
    // This prevents email enumeration attacks
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Error during password reset request:', error);
    return NextResponse.json(
      { error: 'Password reset request failed' },
      { status: 500 }
    );
  }
}
