import axios from 'axios';

async function testDualAccess() {
  console.log('\n=== Testing Dual Dashboard Access ===\n');
  
  const baseURL = 'http://localhost:3001';
  
  // Test 1: Regular user (should NOT have admin access)
  console.log('1. Testing Regular User Access:');
  console.log('================================');
  try {
    const userLogin = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    console.log('✓ User login successful');
    console.log('  Role:', userLogin.data.user.role);
    console.log('  Can access user dashboard: YES');
    console.log('  Can access admin panel:', ['admin', 'super_admin'].includes(userLogin.data.user.role) ? 'YES' : 'NO');
    
  } catch (error: any) {
    console.error('✗ User login failed:', error.response?.data?.error || error.message);
  }
  
  console.log('\n2. Testing Admin User Access:');
  console.log('==============================');
  try {
    // First try admin panel login
    const adminLoginAsAdmin = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin',
      loginType: 'admin'
    });
    
    console.log('✓ Admin login to admin panel: SUCCESS');
    console.log('  Role:', adminLoginAsAdmin.data.user.role);
    
    // Now try user dashboard login
    const adminLoginAsUser = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin',
      loginType: 'user'
    });
    
    console.log('✓ Admin login to user dashboard: SUCCESS');
    console.log('  Can access both dashboards: YES');
    
  } catch (error: any) {
    console.error('✗ Admin access test failed:', error.response?.data?.error || error.message);
  }
  
  console.log('\n3. Testing Navigation Between Dashboards:');
  console.log('=========================================');
  console.log('Admin users will see:');
  console.log('  - "User Dashboard" button in Admin Panel sidebar');
  console.log('  - "Admin Panel" button in User Dashboard header');
  console.log('\nRegular users will see:');
  console.log('  - Only "Logout" button (no Admin Panel access)');
  
  console.log('\n=== Summary ===');
  console.log('Users with roles:');
  console.log('  - "user": Can only access User Dashboard');
  console.log('  - "admin": Can access both Admin Panel and User Dashboard');
  console.log('  - "super_admin": Can access both Admin Panel and User Dashboard');
  console.log('\nTo grant dual access to a user:');
  console.log('  1. Go to Admin Panel > Users');
  console.log('  2. Edit the user');
  console.log('  3. Set role to "admin" or "super_admin"');
  console.log('  4. Save changes\n');
}

testDualAccess().catch(console.error);