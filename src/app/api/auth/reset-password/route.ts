import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.token || !body.password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
      include: { user: true }
    });
    
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });
      
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await hash(body.password, 10);
    
    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });
    
    // Delete used reset token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });
    
    // Delete all other reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId }
    });
    
    return NextResponse.json({
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Error during password reset:', error);
    return NextResponse.json(
      { error: 'Password reset failed' },
      { status: 500 }
    );
  }
}