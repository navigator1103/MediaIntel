// Simple script to test login credentials
const fetch = require('node-fetch');

async function testLogin(email, password) {
  try {
    console.log(`Testing login for ${email}...`);
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful!');
      console.log('User data:', data.user);
    } else {
      console.log('Login failed:', data.error);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Test admin login
testLogin('admin@example.com', 'admin')
  .then(() => {
    // Test regular user login
    return testLogin('user@example.com', 'user');
  });
