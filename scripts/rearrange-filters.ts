import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../src/app/dashboard/media-sufficiency/page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Find the filters section
const startMarker = '<div className="p-4 overflow-y-auto flex-1">';
const endMarker = '{/* Clear Filters Button */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find filter section markers');
  process.exit(1);
}

// Extract individual filter blocks
const filtersSection = content.substring(startIndex, endIndex);

// Define regex patterns for each filter block
const filterPatterns = {
  financialCycle: /\{\/\* Last Update \/ Financial Cycle Filter \*\/\}[\s\S]*?(?=\{\/\*|$)/,
  businessUnit: /\{\/\* Business Unit Filter \*\/\}[\s\S]*?(?=\{\/\*|$)/,
  country: /\{\/\* Country Filter \*\/\}[\s\S]*?(?=\{\/\*|$)/,
  category: /\{\/\* Category Filter \*\/\}[\s\S]*?(?=\{\/\*|$)/,
  mediaType: /\{\/\* Media Type Filter \*\/\}[\s\S]*?(?=\{\/\*|$)/,
  range: /\{\/\* Range Filter \*\/\}[\s\S]*?(?=\{\/\*|$)/
};

// Extract each filter block
const filters: Record<string, string> = {};
for (const [name, pattern] of Object.entries(filterPatterns)) {
  const match = filtersSection.match(pattern);
  if (match) {
    filters[name] = match[0].trim();
  }
}

// Create new ordered filters section
const newFiltersSection = `<div className="p-4 overflow-y-auto flex-1">
            {/* Filters reordered: Financial Cycle, Business Unit, Country, Category, Media Type, Range */}
            
            ${filters.financialCycle || ''}
            
            ${filters.businessUnit || ''}
            
            ${filters.country || ''}
            
            ${filters.category || ''}
            
            ${filters.mediaType || ''}
            
            ${filters.range || ''}
            
            `;

// Replace the old section with the new one
const newContent = content.substring(0, startIndex) + newFiltersSection + content.substring(endIndex);

// Write back the file
fs.writeFileSync(filePath, newContent, 'utf-8');
console.log('Filters have been rearranged successfully!');