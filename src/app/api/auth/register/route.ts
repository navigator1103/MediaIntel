import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';
import { generateVerificationToken } from '@/lib/auth/tokens';
import { sendWelcomeEmail } from '@/lib/email/sendgrid';

// POST /api/auth/register - User registration with email verification
export async function POST(request: NextRequest) {
  try {
    console.log('Registration attempt started...');
    const body = await request.json();
    console.log('Request body:', { ...body, password: '[REDACTED]' });
    
    // Validate required fields
    if (!body.email || !body.password || !body.name) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (body.password.length < 8) {
      console.log('Validation failed: password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    console.log('Checking for existing user...');
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });
    
    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    console.log('Hashing password...');
    // Hash password
    const hashedPassword = await hash(body.password, 10);
    
    console.log('Generating verification token...');
    // Generate verification token
    const verificationToken = generateVerificationToken();
    
    console.log('Creating user in database...');
    // Create new user with email verification
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        password: hashedPassword,
        role: body.role || 'user',
        emailVerified: false,
        verificationToken
      }
    });
    
    console.log('User created successfully:', user.id);
    
    // Send welcome email with verification link
    console.log('Sending welcome email...');
    try {
      const emailSent = await sendWelcomeEmail(user.email, user.name || '', verificationToken);
      if (emailSent) {
        console.log('Welcome email sent successfully');
      } else {
        console.log('Failed to send welcome email');
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }
    
    // Return user info (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      },
      message: 'Registration successful! Please check your email to verify your account.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}