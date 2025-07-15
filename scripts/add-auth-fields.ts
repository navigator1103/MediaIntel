import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function addAuthFields() {
  try {
    console.log('Adding authentication fields to database...');
    
    // Check if columns already exist
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(users);`;
    const columns = (tableInfo as any[]).map(col => col.name);
    
    const statements = [];
    
    if (!columns.includes('email_verified')) {
      statements.push(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;`);
    }
    
    if (!columns.includes('verification_token')) {
      statements.push(`ALTER TABLE users ADD COLUMN verification_token TEXT;`);
    }
    
    // Create password reset tokens table if it doesn't exist
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='password_reset_tokens';`;
    if ((tables as any[]).length === 0) {
      statements.push(`
        CREATE TABLE password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);
      statements.push(`CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);`);
    }
    
    // Execute all statements
    for (const statement of statements) {
      console.log('Executing:', statement);
      await prisma.$executeRawUnsafe(statement);
    }
    
    console.log('Authentication fields added successfully!');
  } catch (error) {
    console.error('Error adding auth fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAuthFields();