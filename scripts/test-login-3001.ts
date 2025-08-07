import axios from 'axios';

async function testLoginPort3001() {
  console.log('\n=== Testing Login on Port 3001 ===\n');
  
  const baseURL = 'http://localhost:3001';
  
  console.log('1. Testing user@example.com with loginType: "user" on port 3001:');
  console.log('================================================================');
  try {
    const response = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    console.log('✓ Login successful as user');
    console.log('  Token:', response.data.token);
    console.log('  User role:', response.data.user.role);
    console.log('  Accessible countries:', response.data.user.accessibleCountries);
    
  } catch (error: any) {
    console.error('✗ Login failed:', error.response?.data?.error || error.message);
    console.error('  Status:', error.response?.status);
    if (error.response?.status === 500) {
      console.error('  This might indicate a database user conflict');
    }
  }
  
  console.log('\n2. Testing with different email cases:');
  console.log('======================================');
  const tests = [
    { email: 'user@example.com', desc: 'Lowercase' },
    { email: 'User@example.com', desc: 'Capitalized' },
    { email: 'USER@EXAMPLE.COM', desc: 'Uppercase' },
  ];
  
  for (const test of tests) {
    try {
      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: test.email,
        password: 'user',
        loginType: 'user'
      });
      console.log(`  ✓ ${test.desc}: Success (Token: ${response.data.token.substring(0, 20)}...)`);
    } catch (error: any) {
      console.log(`  ✗ ${test.desc}: Failed - ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log('\n3. Testing admin@example.com:');
  console.log('============================');
  try {
    const response = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin',
      loginType: 'admin'
    });
    
    console.log('✓ Admin login successful');
    console.log('  Token:', response.data.token);
    console.log('  User role:', response.data.user.role);
    
  } catch (error: any) {
    console.error('✗ Admin login failed:', error.response?.data?.error || error.message);
  }
}

testLoginPort3001().catch(console.error);