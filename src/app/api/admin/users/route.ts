import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// GET /api/admin/users - Get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accessibleCountries: true,
        accessibleBrands: true,
        accessiblePages: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Creating user with data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.email || !data.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password using bcrypt (same as login)
    const hashedPassword = await hash(data.password, 12);
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || 'user',
        accessibleCountries: data.accessibleCountries,
        accessibleBrands: data.accessibleBrands,
        accessiblePages: data.accessiblePages,
        emailVerified: true, // Auto-verify admin-created users
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accessibleCountries: true,
        accessibleBrands: true,
        accessiblePages: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
