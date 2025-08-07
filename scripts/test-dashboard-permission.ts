import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testDashboardPermission() {
  console.log('\n=== Testing User Dashboard Permission System ===\n');
  
  const baseURL = 'http://localhost:3001';
  
  // First, let's check the current permission for user@example.com
  console.log('1. Checking current database permission:');
  console.log('=========================================');
  
  const dbUser = await prisma.user.findUnique({
    where: { email: 'user@example.com' }
  });
  
  if (dbUser) {
    console.log('User found:');
    console.log('  Email:', dbUser.email);
    console.log('  Role:', dbUser.role);
    console.log('  Can Access User Dashboard:', dbUser.canAccessUserDashboard);
    console.log('  Accessible Countries:', dbUser.accessibleCountries);
  } else {
    console.log('User not found in database');
  }
  
  console.log('\n2. Testing login with current permission:');
  console.log('==========================================');
  
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    console.log('✓ Login successful');
    console.log('  Role:', loginResponse.data.user.role);
    console.log('  Can Access User Dashboard:', loginResponse.data.user.canAccessUserDashboard);
    
  } catch (error: any) {
    console.error('✗ Login failed:', error.response?.data?.error || error.message);
  }
  
  console.log('\n3. Testing permission scenarios:');
  console.log('=================================');
  
  // Test scenario 1: Set permission to false
  console.log('\nScenario A: Disable user dashboard access for admin');
  await prisma.user.update({
    where: { email: 'user@example.com' },
    data: { 
      role: 'admin',
      canAccessUserDashboard: false 
    }
  });
  
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    console.log('  ✗ UNEXPECTED: Admin was able to login to user dashboard');
    
  } catch (error: any) {
    console.log('  ✓ Expected: Admin blocked from user dashboard');
    console.log('    Error:', error.response?.data?.error || error.message);
  }
  
  // Test scenario 2: Set permission to true
  console.log('\nScenario B: Enable user dashboard access for admin');
  await prisma.user.update({
    where: { email: 'user@example.com' },
    data: { 
      role: 'admin',
      canAccessUserDashboard: true 
    }
  });
  
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user',
      loginType: 'user'
    });
    
    console.log('  ✓ Admin successfully accessed user dashboard');
    console.log('    Can switch between admin and user views');
    
  } catch (error: any) {
    console.log('  ✗ UNEXPECTED: Admin was blocked from user dashboard');
    console.log('    Error:', error.response?.data?.error || error.message);
  }
  
  // Restore original state
  console.log('\n4. Restoring original user state:');
  console.log('==================================');
  await prisma.user.update({
    where: { email: 'user@example.com' },
    data: { 
      role: 'user',
      canAccessUserDashboard: true 
    }
  });
  console.log('✓ User restored to role: user with dashboard access');
  
  await prisma.$disconnect();
  
  console.log('\n=== Summary ===');
  console.log('The permission system works as follows:');
  console.log('1. Regular users (role: "user") always have user dashboard access');
  console.log('2. Admin users need canAccessUserDashboard = true to access user dashboard');
  console.log('3. Super admins can control this permission in User Management');
  console.log('4. When disabled, admins can only access the admin panel\n');
}

testDashboardPermission().catch(console.error);