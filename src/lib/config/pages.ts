export interface PageConfig {
  id: string;
  name: string;
  path: string;
  category: 'dashboard' | 'admin' | 'media-sufficiency' | 'master-data' | 'system';
  description?: string;
  requiresAdmin?: boolean;
}

export const PAGES: PageConfig[] = [
  // Dashboard Pages
  {
    id: 'dashboard',
    name: 'Dashboard Home',
    path: '/dashboard',
    category: 'dashboard',
    description: 'Main dashboard overview'
  },
  {
    id: 'dashboard-media-sufficiency',
    name: 'Media Sufficiency Dashboard',
    path: '/dashboard/media-sufficiency',
    category: 'dashboard',
    description: 'Media sufficiency analytics and insights'
  },

  // Admin Pages
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    path: '/admin',
    category: 'admin',
    description: 'Admin overview and navigation',
    requiresAdmin: true
  },
  {
    id: 'admin-users',
    name: 'User Management',
    path: '/admin/users',
    category: 'system',
    description: 'Manage users and permissions',
    requiresAdmin: true
  },
  {
    id: 'admin-backups',
    name: 'Backups',
    path: '/admin/backups',
    category: 'system',
    description: 'Database backup management',
    requiresAdmin: true
  },
  {
    id: 'admin-governance',
    name: 'Governance',
    path: '/admin/governance',
    category: 'admin',
    description: 'Review and approve auto-created entities',
    requiresAdmin: true
  },

  // Media Sufficiency Pages
  {
    id: 'media-sufficiency-upload',
    name: 'Media Sufficiency Upload',
    path: '/admin/media-sufficiency',
    category: 'media-sufficiency',
    description: 'Upload media sufficiency data'
  },
  {
    id: 'media-sufficiency-enhanced-upload',
    name: 'Enhanced Upload',
    path: '/admin/media-sufficiency/enhanced-upload',
    category: 'media-sufficiency',
    description: 'Enhanced media sufficiency upload with validation'
  },
  {
    id: 'media-sufficiency-validate',
    name: 'Validate Data',
    path: '/admin/media-sufficiency/validate',
    category: 'media-sufficiency',
    description: 'Validate uploaded media sufficiency data'
  },
  {
    id: 'media-sufficiency-review',
    name: 'Review Data',
    path: '/admin/media-sufficiency/review',
    category: 'media-sufficiency',
    description: 'Review and approve media sufficiency data'
  },
  {
    id: 'media-sufficiency-game-plans',
    name: 'Game Plans',
    path: '/admin/media-sufficiency/game-plans',
    category: 'media-sufficiency',
    description: 'Manage media sufficiency game plans'
  },
  {
    id: 'game-plans-upload',
    name: 'Game Plans Upload',
    path: '/admin/game-plans/upload',
    category: 'media-sufficiency',
    description: 'Upload game plans data'
  },
  {
    id: 'reach-planning',
    name: 'Reach Planning',
    path: '/admin/reach-planning',
    category: 'media-sufficiency',
    description: 'Plan and manage reach targets'
  },

  // Master Data Pages
  {
    id: 'admin-countries',
    name: 'Countries',
    path: '/admin/countries',
    category: 'master-data',
    description: 'Manage countries and regions'
  },
  {
    id: 'admin-categories',
    name: 'Categories',
    path: '/admin/categories',
    category: 'master-data',
    description: 'Manage product categories'
  },
  {
    id: 'admin-ranges',
    name: 'Ranges',
    path: '/admin/ranges',
    category: 'master-data',
    description: 'Manage product ranges'
  },
  {
    id: 'admin-mapping',
    name: 'BU Mapping',
    path: '/admin/mapping',
    category: 'master-data',
    description: 'View hierarchical business unit mapping',
    requiresAdmin: true
  },
  {
    id: 'admin-campaigns',
    name: 'Campaigns',
    path: '/admin/campaigns',
    category: 'master-data',
    description: 'Manage marketing campaigns'
  },
  {
    id: 'admin-financial-cycles',
    name: 'Financial Cycles',
    path: '/admin/financial-cycles',
    category: 'master-data',
    description: 'Manage financial cycles and periods'
  }
];

// Helper function to get page by ID
export function getPageById(id: string): PageConfig | undefined {
  return PAGES.find(page => page.id === id);
}

// Helper function to get page by path
export function getPageByPath(path: string): PageConfig | undefined {
  return PAGES.find(page => page.path === path);
}

// Helper function to get pages by category
export function getPagesByCategory(category: PageConfig['category']): PageConfig[] {
  return PAGES.filter(page => page.category === category);
}

// Helper function to check if a user has access to a page
export function userHasPageAccess(userAccessiblePages: string | null, pageId: string): boolean {
  if (!userAccessiblePages) return false;
  const accessiblePageIds = userAccessiblePages.split(',').map(id => id.trim());
  return accessiblePageIds.includes(pageId);
}

// Helper function to check if a user has access to a country
export function userHasCountryAccess(userAccessibleCountries: string | null, countryId: string): boolean {
  if (!userAccessibleCountries) return true; // If no restrictions, allow all
  const accessibleCountryIds = userAccessibleCountries.split(',').map(id => id.trim());
  return accessibleCountryIds.includes(countryId);
}