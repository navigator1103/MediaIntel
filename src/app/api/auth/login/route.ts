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
    // Use case-insensitive comparison to handle database conflicts
    if (email.toLowerCase() === 'admin@example.com' && password === 'admin') {
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
    }
    
    // Check for demo user password, but get actual access from database
    if (email.toLowerCase() === 'user@example.com' && password === 'user') {
      // Get the actual user from database to get their current access settings
      const dbUser = await prisma.user.findUnique({
        where: { email: 'user@example.com' }
      });
      
      if (dbUser) {
        // Use database values for access control
        const demoUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || 'Demo User',
          role: dbUser.role,
          accessibleCountries: dbUser.accessibleCountries,
          accessibleBrands: dbUser.accessibleBrands,
          accessiblePages: dbUser.accessiblePages,
          canAccessUserDashboard: dbUser.canAccessUserDashboard
        };
        
        // Validate admin permissions
        if (loginType === 'admin' && !['super_admin', 'admin'].includes(demoUser.role)) {
          return NextResponse.json(
            { error: 'You do not have admin privileges. Please login as a regular user.' },
            { status: 403 }
          );
        }
        
        // Generate real JWT token with actual user data
        const token = jwt.sign(
          { 
            userId: dbUser.id, 
            email: dbUser.email, 
            role: dbUser.role 
          },
          process.env.JWT_SECRET || 'your-jwt-secret-here',
          { expiresIn: '7d' }
        );
        
        return NextResponse.json({
          token,
          user: demoUser
        });
      } else {
        // Fallback if user doesn't exist in database
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }
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
        accessiblePages: user.accessiblePages,
        canAccessUserDashboard: user.canAccessUserDashboard
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
