import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

// Path to the master data file
const MASTER_DATA_PATH = path.resolve('./src/lib/validation/masterData.json');
// Path to the CSV master data file
const CSV_MASTER_DATA_PATH = path.resolve('./MasterData.csv');

export async function GET(request: NextRequest) {
  try {
    console.log('Master data API endpoint called');
    
    // Try to read from JSON file first
    if (fs.existsSync(MASTER_DATA_PATH)) {
      console.log(`Reading master data from JSON file: ${MASTER_DATA_PATH}`);
      const masterDataContent = fs.readFileSync(MASTER_DATA_PATH, 'utf-8');
      const masterData = JSON.parse(masterDataContent);
      console.log('Master data loaded from JSON file');
      return NextResponse.json(masterData);
    }
    
    // If JSON file doesn't exist, try to read from CSV file
    if (fs.existsSync(CSV_MASTER_DATA_PATH)) {
      console.log(`Reading master data from CSV file: ${CSV_MASTER_DATA_PATH}`);
      const csvContent = fs.readFileSync(CSV_MASTER_DATA_PATH, 'utf-8');
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Parsed ${records.length} records from CSV file`);
      
      // Create maps for category-range relationships
      const categoryToRanges: Record<string, string[]> = {};
      const rangeToCategories: Record<string, string[]> = {};
      
      // Process each record
      records.forEach((record: any) => {
        const category = record.Categories?.trim();
        const range = record.Range?.trim();
        
        if (!category || !range) return;
        
        // Add to category-to-ranges map
        if (!categoryToRanges[category]) {
          categoryToRanges[category] = [];
        }
        if (!categoryToRanges[category].includes(range)) {
          categoryToRanges[category].push(range);
        }
        
        // Add to range-to-categories map
        if (!rangeToCategories[range]) {
          rangeToCategories[range] = [];
        }
        if (!rangeToCategories[range].includes(category)) {
          rangeToCategories[range].push(category);
        }
      });
      
      // Create a master data object
      const masterData = {
        categoryToRanges,
        rangeToCategories,
        records
      };
      
      // Save to JSON file for future use
      fs.writeFileSync(MASTER_DATA_PATH, JSON.stringify(masterData, null, 2));
      
      console.log('Master data generated from CSV and saved to JSON file');
      return NextResponse.json(masterData);
    }
    
    // If neither file exists, return an error
    console.error('No master data files found');
    return NextResponse.json(
      { error: 'Master data files not found' }, 
      { status: 404 }
    );
  } catch (error) {
    console.error('Error reading master data:', error);
    return NextResponse.json(
      { error: 'Failed to read master data' }, 
      { status: 500 }
    );
  }
}
