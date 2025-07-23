# Google Analytics Integration

This project now includes Google Analytics (GA4) tracking with ID: `G-G4P0N953RF`

## What's Automatically Tracked

### Page Views
- All page views are automatically tracked when users navigate between pages
- No additional code needed

### User Actions
The following actions are already instrumented with custom event tracking:

1. **Login Events**
   - Tracks successful logins with method (admin/user)
   - Event: `login` with category `authentication`

2. **Signup Events**
   - Tracks successful user registrations
   - Event: `sign_up` with category `authentication`

## Available Tracking Functions

You can add custom tracking to any component by importing the tracking functions:

```typescript
import { 
  trackLogin, 
  trackSignup, 
  trackDataUpload, 
  trackDashboardView, 
  trackPageView, 
  event 
} from '@/lib/gtag';

// Example usage:
trackDataUpload('game_plans');
trackDashboardView('media-sufficiency');
trackPageView('admin-dashboard');

// Custom events:
event({
  action: 'custom_action',
  category: 'custom_category',
  label: 'optional_label',
  value: 123
});
```

## How to Add More Tracking

### Example: Track Button Clicks
```typescript
import { event } from '@/lib/gtag';

const handleButtonClick = () => {
  // Your button logic here
  
  // Track the click
  event({
    action: 'click',
    category: 'button',
    label: 'export_data'
  });
};
```

### Example: Track File Downloads
```typescript
import { event } from '@/lib/gtag';

const handleDownload = (filename: string) => {
  event({
    action: 'download',
    category: 'file',
    label: filename
  });
};
```

## Files Modified

1. **`src/app/layout.tsx`** - Added GA4 script tags
2. **`src/lib/gtag.ts`** - Utility functions for tracking
3. **`src/types/gtag.d.ts`** - TypeScript declarations
4. **`src/app/login/page.tsx`** - Added login tracking
5. **`src/app/register/page.tsx`** - Added signup tracking

## Viewing Analytics

Visit [Google Analytics](https://analytics.google.com/) and access the property with ID `G-G4P0N953RF` to view:

- Real-time user activity
- Page views and user flows
- Custom events (login, signup, etc.)
- User demographics and behavior
- Conversion tracking

## Privacy Compliance

The current implementation tracks standard web analytics data. For GDPR compliance, consider:

1. Adding a cookie consent banner
2. Implementing opt-out functionality
3. Anonymizing IP addresses (GA4 does this by default)
4. Updating privacy policy to mention analytics tracking