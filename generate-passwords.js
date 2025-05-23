// Script to generate password hashes
const bcrypt = require('bcrypt');

async function generateHash(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`Password: "${password}" => Hash: "${hash}"`);
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

// Generate hashes for simple passwords
async function main() {
  await generateHash('admin');
  await generateHash('user');
}

main();
