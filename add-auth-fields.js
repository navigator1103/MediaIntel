const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAuthFields() {
  try {
    console.log('Adding authentication fields to database...');
    
    // Add email_verified column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;`;
      console.log('Added email_verified column');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('email_verified column already exists');
      } else {
        console.log('Error adding email_verified:', error.message);
      }
    }
    
    // Add verification_token column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN verification_token TEXT;`;
      console.log('Added verification_token column');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('verification_token column already exists');
      } else {
        console.log('Error adding verification_token:', error.message);
      }
    }
    
    // Create password_reset_tokens table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;
      console.log('Created password_reset_tokens table');
    } catch (error) {
      console.log('Error creating password_reset_tokens table:', error.message);
    }
    
    // Create index for password reset tokens
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);`;
      console.log('Created index for password_reset_tokens');
    } catch (error) {
      console.log('Error creating index:', error.message);
    }
    
    console.log('Authentication fields migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAuthFields();