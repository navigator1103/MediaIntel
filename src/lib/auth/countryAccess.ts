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
    if (!token) {
      console.log('[CountryAccess] No authorization token found in request');
      return null;
    }

    // Handle special admin token (keeping this for backward compatibility)
    if (token === 'demo-super-admin-token') {
      console.log('[CountryAccess] Demo super admin token detected - full access');
      return { userId: 1, role: 'super_admin', accessibleCountries: null };
    }

    // For all other tokens, decode JWT and get user from database
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-here') as any;
      console.log('[CountryAccess] JWT decoded - userId:', decoded.userId, 'email:', decoded.email);
      
      // Always get user from database to get latest permissions
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, accessibleCountries: true }
      });

      if (!user) {
        console.log('[CountryAccess] User not found in database for ID:', decoded.userId);
        return null;
      }

      console.log('[CountryAccess] User found:', user.email, 'role:', user.role, 'accessibleCountries:', user.accessibleCountries);

      return {
        userId: user.id,
        role: user.role,
        accessibleCountries: user.accessibleCountries
      };
    } catch (jwtError) {
      // If JWT verification fails, it might be an old demo token
      // Try to extract user ID from the token format
      console.error('[CountryAccess] JWT verification failed, token might be invalid:', jwtError);
      return null;
    }
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