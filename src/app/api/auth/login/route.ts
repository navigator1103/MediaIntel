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
      const superAdminUser = {
        id: 1,
        email: 'admin@example.com',
        name: 'Super Admin User',
        role: 'super_admin',
        accessibleCountries: null, // Full access
        accessibleBrands: null,    // Full access
        accessiblePages: null      // Full access
      };
      
      // Validate admin permissions on server side
      if (loginType === 'admin' && !['super_admin', 'admin'].includes(superAdminUser.role)) {
        return NextResponse.json(
          { error: 'You do not have admin privileges. Please login as a regular user.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        token: 'demo-super-admin-token',
        user: superAdminUser
      });
    } else if (email === 'restricted-admin@example.com' && password === 'admin') {
      const restrictedAdminUser = {
        id: 3,
        email: 'restricted-admin@example.com',
        name: 'Restricted Admin User',
        role: 'admin',
        accessibleCountries: '4,33', // Only access to Australia (4) and India (33)
        accessibleBrands: null,     // Full brand access
        accessiblePages: 'game-plans,reach-planning,dashboard' // Limited page access
      };
      
      // Validate admin permissions on server side
      if (loginType === 'admin' && !['super_admin', 'admin'].includes(restrictedAdminUser.role)) {
        return NextResponse.json(
          { error: 'You do not have admin privileges. Please login as a regular user.' },
          { status: 403 }
        );
      }
      
      return NextResponse.json({
        token: 'demo-restricted-admin-token',
        user: restrictedAdminUser
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

    // Email verification check removed - auto-verify all users

    // Validate admin permissions for real users
    if (loginType === 'admin' && !['super_admin', 'admin'].includes(user.role)) {
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
        emailVerified: user.emailVerified,
        accessibleCountries: user.accessibleCountries,
        accessibleBrands: user.accessibleBrands,
        accessiblePages: user.accessiblePages
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
