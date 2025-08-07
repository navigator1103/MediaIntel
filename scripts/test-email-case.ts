import axios from 'axios';

async function testEmailCase() {
  console.log('\n=== Testing Email Case Sensitivity ===\n');
  
  const tests = [
    { email: 'user@example.com', password: 'user', desc: 'Lowercase email (expected)' },
    { email: 'User@example.com', password: 'user', desc: 'Capitalized email' },
    { email: 'USER@EXAMPLE.COM', password: 'user', desc: 'Uppercase email' },
    { email: 'user@Example.com', password: 'user', desc: 'Mixed case domain' },
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.desc}`);
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: test.email,
        password: test.password,
        loginType: 'user'
      });
      console.log(`  ✓ Success with "${test.email}"`);
      console.log(`    Token: ${response.data.token}`);
    } catch (error: any) {
      console.log(`  ✗ Failed with "${test.email}"`);
      console.log(`    Error: ${error.response?.data?.error || error.message}`);
      console.log(`    Status: ${error.response?.status}`);
    }
  }
  
  console.log('\n=== Testing with wrong password ===\n');
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'user@example.com',
      password: 'wrong-password',
      loginType: 'user'
    });
    console.log('  ✗ UNEXPECTED: Login succeeded with wrong password!');
  } catch (error: any) {
    console.log('  ✓ Correctly rejected wrong password');
    console.log(`    Error: ${error.response?.data?.error}`);
  }
}

testEmailCase().catch(console.error);