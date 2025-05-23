/**
 * Handles user logout by clearing localStorage and cookies
 */
export const handleLogout = (router: any) => {
  // Clear localStorage immediately to prevent state issues
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Use a try-catch for the API call, but don't await it
  try {
    // Call the logout API to clear the cookie, but don't wait for it
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(err => {
      console.error('Logout API error (non-blocking):', err);
    });
  } catch (error) {
    console.error('Error during logout (non-blocking):', error);
  }
  
  // Redirect to login page immediately
  router.push('/login');
};
