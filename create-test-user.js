const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create a test user with regular role
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'user',
        emailVerified: true
      }
    });
    
    console.log('Test user created successfully:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating test user:', error);
    await prisma.$disconnect();
  }
}

createTestUser();