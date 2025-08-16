const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

const prisma = new PrismaClient();

async function testSync() {
  console.log('Testing user sync...\n');
  
  // Download and open production database
  const prodDb = new Database('/tmp/prod_check.db', { readonly: true });
  
  // Get the 3 missing users
  const missingUsers = prodDb.prepare(`
    SELECT * FROM users 
    WHERE email IN ('jon123@gmail.com', 'jon@gmail.com', 'preeyal.shinde@omc.com')
  `).all();
  
  console.log(`Found ${missingUsers.length} missing users in production:\n`);
  
  for (const user of missingUsers) {
    console.log(`\nTrying to insert user: ${user.email} (ID: ${user.id})`);
    
    try {
      // Try the raw SQL approach
      await prisma.$executeRawUnsafe(`
        INSERT INTO users (id, email, password, name, role, accessible_countries, accessible_brands, accessible_pages, can_access_user_dashboard)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        user.id,
        user.email,
        user.password,
        user.name || '',
        user.role || 'user',
        user.accessible_countries || '',
        user.accessible_brands || '',
        user.accessible_pages || '',
        user.can_access_user_dashboard === 0 ? 0 : 1
      );
      
      console.log(`✅ Successfully inserted ${user.email}`);
      
    } catch (error) {
      console.error(`❌ Error inserting ${user.email}:`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error code: ${error.code}`);
      if (error.meta) {
        console.error(`   Meta:`, error.meta);
      }
    }
  }
  
  // Check final count
  const count = await prisma.user.count();
  console.log(`\nFinal user count: ${count}`);
  
  prodDb.close();
  await prisma.$disconnect();
}

testSync().catch(console.error);