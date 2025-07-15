import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password, loginType } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Login attempt for:', email);

    // Check for demo accounts first (maintain backward compatibility)
    if (email === 'admin@example.com' && password === 'admin') {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };
      
      // Validate admin permissions on server side
      if (loginType === 'admin' && adminUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have admin privileges. Please login as a regular user.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        token: 'demo-admin-token',
        user: adminUser
      });
    } else if (email === 'user@example.com' && password === 'user') {
      const regularUser = {
        id: 2,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
      };
      
      // Validate admin permissions on server side
      if (loginType === 'admin' && regularUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have admin privileges. Please login as a regular user.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        token: 'demo-user-token',
        user: regularUser
      });
    }

    // Check database for real users
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('Email not verified for user:', email);
      return NextResponse.json(
        { error: 'Please verify your email before logging in. Check your inbox for the verification link.' },
        { status: 403 }
      );
    }

    // Validate admin permissions for real users
    if (loginType === 'admin' && user.role !== 'admin') {
      console.log('Admin access denied for user:', email, 'Role:', user.role);
      return NextResponse.json(
        { error: 'You do not have admin privileges. Please login as a regular user.' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-jwt-secret-here',
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', email);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
