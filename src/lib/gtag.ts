// Google Analytics configuration and utility functions

export const GA_TRACKING_ID = 'G-G4P0N953RF';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Predefined event functions for common actions
export const trackLogin = (method: 'admin' | 'user') => {
  event({
    action: 'login',
    category: 'authentication',
    label: method,
  });
};

export const trackSignup = () => {
  event({
    action: 'sign_up',
    category: 'authentication',
  });
};

export const trackDataUpload = (type: 'game_plans' | 'media_sufficiency') => {
  event({
    action: 'upload',
    category: 'data_management',
    label: type,
  });
};

export const trackDashboardView = (dashboard: string) => {
  event({
    action: 'view_dashboard',
    category: 'engagement',
    label: dashboard,
  });
};

export const trackPageView = (pageName: string) => {
  event({
    action: 'page_view',
    category: 'navigation',
    label: pageName,
  });
};