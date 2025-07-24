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
    if (!body.email || !body.password || !body.name || !body.countryId) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Email, password, name, and country are required' },
        { status: 400 }
      );
    }
    
    // Validate countryId is a valid number
    const countryId = parseInt(body.countryId);
    if (isNaN(countryId)) {
      console.log('Validation failed: invalid country ID');
      return NextResponse.json(
        { error: 'Invalid country selection' },
        { status: 400 }
      );
    }
    
    // Verify country exists
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    });
    
    if (!country) {
      console.log('Validation failed: country not found');
      return NextResponse.json(
        { error: 'Selected country does not exist' },
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
    // All new signups get admin role with specific page and country access
    const restrictedAdminPages = 'media-sufficiency-upload,media-sufficiency-enhanced-upload,media-sufficiency-validate,media-sufficiency-review,media-sufficiency-game-plans,game-plans-upload';
    
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        password: hashedPassword,
        role: 'admin', // All new signups get admin role
        emailVerified: true, // Auto-verify all new users
        verificationToken,
        accessibleCountries: countryId.toString(), // Single country access
        accessiblePages: restrictedAdminPages, // Specific page access
        accessibleBrands: null // No brand restrictions
      }
    });
    
    console.log('User created successfully:', user.id);
    
    // Email verification disabled - users are auto-verified
    console.log('User registered and auto-verified');
    
    // Return user info (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      },
      message: 'Registration successful! You can now log in to your account.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}