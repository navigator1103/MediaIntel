// Script to check for mismatched JSX tags in a file
const fs = require('fs');
const path = require('path');

// Path to the file with the error
const filePath = path.join(__dirname, '..', 'src', 'app', 'admin', 'media-sufficiency', 'validate', 'page.tsx');

// Read the file content
const content = fs.readFileSync(filePath, 'utf8');

// Simple check for balanced tags
const lines = content.split('\n');
let openTags = 0;
let closeTags = 0;

lines.forEach((line, index) => {
  // Count opening tags (excluding self-closing tags)
  const openMatches = line.match(/<[a-zA-Z][^<>]*(?<!\/)[>]/g);
  if (openMatches) openTags += openMatches.length;
  
  // Count closing tags
  const closeMatches = line.match(/<\/[a-zA-Z][^<>]*>/g);
  if (closeMatches) closeTags += closeMatches.length;
  
  // Count self-closing tags (they don't affect the balance)
  const selfClosingMatches = line.match(/<[^<>]*\/>/g);
  
  console.log(`Line ${index + 1}: Open: ${openMatches?.length || 0}, Close: ${closeMatches?.length || 0}, Self-closing: ${selfClosingMatches?.length || 0}`);
});

console.log(`\nTotal: Open tags: ${openTags}, Close tags: ${closeTags}, Difference: ${openTags - closeTags}`);

// Check for specific issues around line 967
const contextLines = lines.slice(960, 975);
console.log('\nContext around line 967:');
contextLines.forEach((line, i) => {
  console.log(`${960 + i}: ${line}`);
});
