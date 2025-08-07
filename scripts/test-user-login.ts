import axios from 'axios';

async function testUserLogin() {
  console.log('\n=== Testing User Login Flow ===\n');
  
  const baseURL = 'http://localhost:3000';
  
  console.log('1. Testing user@example.com with loginType: "user":');
  console.log('==================================================');
  try {
    const userLoginAsUser = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'  // Explicitly set to user
    });
    
    console.log('✓ Login successful as user');
    console.log('  Token:', userLoginAsUser.data.token);
    console.log('  User role:', userLoginAsUser.data.user.role);
    console.log('  Accessible countries:', userLoginAsUser.data.user.accessibleCountries);
    
  } catch (error: any) {
    console.error('✗ Login failed:', error.response?.data?.error || error.message);
    console.error('  Status:', error.response?.status);
  }
  
  console.log('\n2. Testing user@example.com with loginType: "admin":');
  console.log('====================================================');
  try {
    const userLoginAsAdmin = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'admin'  // Try to login as admin (should fail)
    });
    
    console.log('✗ UNEXPECTED: User was able to login as admin!');
    console.log('  This should not happen');
    
  } catch (error: any) {
    console.log('✓ Expected error:', error.response?.data?.error || error.message);
    console.log('  Status:', error.response?.status);
  }
  
  console.log('\n3. Testing user@example.com with no loginType:');
  console.log('==============================================');
  try {
    const userLoginNoType = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user'
      // No loginType specified
    });
    
    console.log('✓ Login successful without loginType');
    console.log('  Token:', userLoginNoType.data.token);
    console.log('  User role:', userLoginNoType.data.user.role);
    
  } catch (error: any) {
    console.error('✗ Login failed:', error.response?.data?.error || error.message);
  }
  
  console.log('\n=== Summary ===');
  console.log('The user should:');
  console.log('1. Be able to login with loginType: "user"');
  console.log('2. NOT be able to login with loginType: "admin"');
  console.log('3. Be able to login without specifying loginType');
  console.log('\nIf the user is getting "access denied", check:');
  console.log('- They are clicking "Login as User" button, not "Login as Admin"');
  console.log('- The loginType parameter is being sent correctly from the frontend\n');
}

testUserLogin().catch(console.error);