import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export interface UserCountryAccess {
  userId: number;
  role: string;
  accessibleCountries: string | null;
}

// Extract user from JWT token in request
export async function getUserFromRequest(request: NextRequest): Promise<UserCountryAccess | null> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return null;

    // For demo tokens, return hardcoded permissions
    if (token === 'demo-super-admin-token') {
      return { userId: 1, role: 'super_admin', accessibleCountries: null };
    }
    if (token === 'demo-restricted-admin-token') {
      return { userId: 3, role: 'admin', accessibleCountries: '4,33' };
    }
    if (token === 'demo-user-token') {
      return { userId: 2, role: 'user', accessibleCountries: null };
    }

    // Decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-here') as any;
    
    // Get user from database to get latest permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, accessibleCountries: true }
    });

    if (!user) return null;

    return {
      userId: user.id,
      role: user.role,
      accessibleCountries: user.accessibleCountries
    };
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

// Check if user has access to specific country
export function hasCountryAccess(userAccess: UserCountryAccess, countryId: number): boolean {
  // Super admins have access to all countries
  if (userAccess.role === 'super_admin') return true;

  // If no restrictions, allow access to all
  if (!userAccess.accessibleCountries) return true;

  // Check if country ID is in accessible countries list
  const accessibleCountryIds = userAccess.accessibleCountries
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));

  return accessibleCountryIds.includes(countryId);
}

// Get list of accessible country IDs for a user
export function getAccessibleCountryIds(userAccess: UserCountryAccess): number[] {
  // Super admins have access to all countries (return empty array to indicate no filtering)
  if (userAccess.role === 'super_admin') return [];

  // If no restrictions, return empty array (no filtering)
  if (!userAccess.accessibleCountries) return [];

  // Parse accessible countries from string
  return userAccess.accessibleCountries
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));
}

// Create Prisma where clause for country filtering
export function createCountryWhereClause(userAccess: UserCountryAccess) {
  const accessibleCountryIds = getAccessibleCountryIds(userAccess);
  
  // If empty array, no filtering needed (admin or no restrictions)
  if (accessibleCountryIds.length === 0) return {};

  // Return where clause to filter by accessible countries
  return {
    countryId: {
      in: accessibleCountryIds
    }
  };
}

// Filter countries array based on user access
export async function filterCountriesByAccess(userAccess: UserCountryAccess): Promise<any[]> {
  const accessibleCountryIds = getAccessibleCountryIds(userAccess);
  
  // Build where clause
  const whereClause = accessibleCountryIds.length > 0 
    ? { id: { in: accessibleCountryIds } }
    : {};

  // Fetch countries from database
  const countries = await prisma.country.findMany({
    where: whereClause,
    include: {
      region: true,
      subRegion: true,
      cluster: true
    },
    orderBy: { name: 'asc' }
  });

  return countries;
}