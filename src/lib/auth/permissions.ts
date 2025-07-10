import { getPageByPath, userHasPageAccess, userHasCountryAccess } from '@/lib/config/pages';

export interface UserPermissions {
  id: number;
  email: string;
  role: string;
  accessiblePages: string | null;
  accessibleCountries: string | null;
}

export class PermissionChecker {
  private user: UserPermissions;

  constructor(user: UserPermissions) {
    this.user = user;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.user.role === 'admin';
  }

  // Check if user has access to a specific page by path
  canAccessPath(path: string): boolean {
    // Admins have access to everything
    if (this.isAdmin()) return true;

    // Get page config
    const page = getPageByPath(path);
    if (!page) return true; // If page is not in config, allow access (for now)

    // Check if page requires admin
    if (page.requiresAdmin && !this.isAdmin()) return false;

    // Check if user has specific page access
    return userHasPageAccess(this.user.accessiblePages, page.id);
  }

  // Check if user has access to a specific page by ID
  canAccessPage(pageId: string): boolean {
    // Admins have access to everything
    if (this.isAdmin()) return true;

    return userHasPageAccess(this.user.accessiblePages, pageId);
  }

  // Check if user has access to a specific country
  canAccessCountry(countryId: string): boolean {
    // Admins have access to everything
    if (this.isAdmin()) return true;

    return userHasCountryAccess(this.user.accessibleCountries, countryId);
  }

  // Get list of accessible page IDs
  getAccessiblePageIds(): string[] {
    if (this.isAdmin()) {
      // Return all page IDs for admin
      const { PAGES } = require('@/lib/config/pages');
      return PAGES.map((page: any) => page.id);
    }

    if (!this.user.accessiblePages) return [];
    return this.user.accessiblePages.split(',').map(id => id.trim());
  }

  // Get list of accessible country IDs
  getAccessibleCountryIds(): string[] {
    if (this.isAdmin()) return []; // Empty array means all countries for admin

    if (!this.user.accessibleCountries) return []; // Empty array means all countries if no restrictions
    return this.user.accessibleCountries.split(',').map(id => id.trim());
  }
}

// Helper function to create a PermissionChecker from localStorage user data
export function createPermissionChecker(userData: any): PermissionChecker | null {
  if (!userData) return null;

  return new PermissionChecker({
    id: userData.id,
    email: userData.email,
    role: userData.role || 'user',
    accessiblePages: userData.accessiblePages || null,
    accessibleCountries: userData.accessibleCountries || null,
  });
}

// Hook-friendly permission check
export function usePermissions() {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    const userData = JSON.parse(userStr);
    return createPermissionChecker(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}