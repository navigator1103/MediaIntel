import axios from 'axios';

async function testSavePermission() {
  console.log('\n=== Testing Save User Dashboard Permission ===\n');
  
  const baseURL = 'http://localhost:3001';
  
  // First, login as admin
  console.log('1. Logging in as admin:');
  console.log('========================');
  
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin',
      loginType: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Admin logged in successfully');
    
    // Get users list
    console.log('\n2. Fetching users list:');
    console.log('=======================');
    const usersResponse = await axios.get(`${baseURL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Found ${usersResponse.data.length} users`);
    
    // Find user@example.com
    const testUser = usersResponse.data.find((u: any) => u.email === 'user@example.com');
    if (testUser) {
      console.log('\nTest user details:');
      console.log('  ID:', testUser.id);
      console.log('  Email:', testUser.email);
      console.log('  Role:', testUser.role);
      console.log('  Can Access User Dashboard:', testUser.canAccessUserDashboard);
      
      // Test updating the permission
      console.log('\n3. Testing permission update:');
      console.log('=============================');
      
      // Set to false
      console.log('\nSetting canAccessUserDashboard to FALSE...');
      const updateFalse = await axios.put(
        `${baseURL}/api/admin/users/${testUser.id}`,
        {
          ...testUser,
          canAccessUserDashboard: false
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('  Result:', updateFalse.data.canAccessUserDashboard === false ? '✓ Successfully set to false' : '✗ Failed to set to false');
      
      // Set to true
      console.log('\nSetting canAccessUserDashboard to TRUE...');
      const updateTrue = await axios.put(
        `${baseURL}/api/admin/users/${testUser.id}`,
        {
          ...testUser,
          canAccessUserDashboard: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('  Result:', updateTrue.data.canAccessUserDashboard === true ? '✓ Successfully set to true' : '✗ Failed to set to true');
      
      // Verify by fetching again
      console.log('\n4. Verifying saved value:');
      console.log('=========================');
      const verifyResponse = await axios.get(
        `${baseURL}/api/admin/users/${testUser.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('  Current value:', verifyResponse.data.canAccessUserDashboard);
      
    } else {
      console.log('✗ Test user not found');
    }
    
  } catch (error: any) {
    console.error('✗ Error:', error.response?.data?.error || error.message);
  }
  
  console.log('\n=== Summary ===');
  console.log('The checkbox should now save correctly when:');
  console.log('1. Checking the box (sets to true)');
  console.log('2. Unchecking the box (sets to false)');
  console.log('3. The saved value persists after page refresh\n');
}

testSavePermission().catch(console.error);