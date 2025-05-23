import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Extracts user information from the JWT token in the request
 * @param request The Next.js request object
 * @returns User information from the token or null if no valid token exists
 */
export const getUserFromToken = (request: NextRequest) => {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('token')?.value;
    let apiToken = null;
    
    if (request.headers.get('authorization')) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiToken = authHeader.split(' ')[1];
      }
    }
    
    // Use either the cookie token or API token
    const authToken = apiToken || token;
    
    if (!authToken) {
      console.log('No auth token found in request');
      return null;
    }
    
    // Verify and decode the token
    const decoded = verify(
      authToken,
      process.env.JWT_SECRET || 'golden-rules-secret'
    ) as JwtPayload;
    
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};
