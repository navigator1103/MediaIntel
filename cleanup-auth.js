const fs = require('fs');
const path = require('path');

// Remove the (auth) directory that's causing conflicts
const authDir = path.join(__dirname, 'src/app/(auth)');

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        removeDir(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    
    fs.rmdirSync(dirPath);
    console.log(`Removed directory: ${dirPath}`);
  }
}

try {
  removeDir(authDir);
  console.log('Cleanup completed successfully!');
} catch (error) {
  console.error('Error during cleanup:', error);
}