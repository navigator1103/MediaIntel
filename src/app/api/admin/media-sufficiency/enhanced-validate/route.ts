import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import MediaSufficiencyValidator from '@/lib/validation/mediaSufficiencyValidator';
import { prisma } from '@/lib/prisma';

// Define session data structure
interface SessionData {
  id: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  recordCount: number;
  createdAt: Date;
  masterData?: any;
  fieldMappings?: Record<string, string>;
}

// Define the expected field names
const expectedFields = [
  'Year', 'Sub Region', 'Country', 'Category', 'Range', 'Campaign', 
  'Media', 'Media Subtype', 'Start Date', 'End Date', 'Budget',
  'Q1 Budget', 'Q2 Budget', 'Q3 Budget', 'Q4 Budget',
  'Target Reach', 'Current Reach', 'Business Unit', 'PM Type',
  'Campaign Status', 'Campaign Type', 'Campaign Priority', 'Last Update', 'Last Modified By'
];

// Define common field name variations for smart mapping
const fieldVariations: Record<string, string[]> = {
  'Year': ['year', 'yr', 'fiscal year', 'fy'],
  'Sub Region': ['sub region', 'subregion', 'region', 'area'],
  'Country': ['country', 'nation', 'market'],
  'Category': ['category', 'cat', 'product category'],
  'Range': ['range', 'product range', 'product line'],
  'Campaign': ['campaign', 'camp', 'initiative'],
  'Media': ['media', 'media type', 'channel'],
  'Media Subtype': ['media subtype', 'subtype', 'sub type', 'media sub type'],
  'Start Date': ['start date', 'start', 'from date', 'begin date'],
  'End Date': ['end date', 'end', 'to date', 'finish date'],
  'Budget': ['budget', 'total budget', 'spend', 'total spend'],
  'Q1 Budget': ['q1 budget', 'q1', 'q1 spend', 'quarter 1 budget'],
  'Q2 Budget': ['q2 budget', 'q2', 'q2 spend', 'quarter 2 budget'],
  'Q3 Budget': ['q3 budget', 'q3', 'q3 spend', 'quarter 3 budget'],
  'Q4 Budget': ['q4 budget', 'q4', 'q4 spend', 'quarter 4 budget'],
  'Target Reach': ['target reach', 'target', 'goal reach', 'reach target'],
  'Current Reach': ['current reach', 'actual reach', 'reach', 'achieved reach'],
  'Business Unit': ['business unit', 'bu', 'division', 'department'],
  'PM Type': ['pm type', 'pm', 'project manager type'],
  'Campaign Status': ['campaign status', 'status', 'state', 'campaign state'],
  'Campaign Type': ['campaign type', 'type', 'campaign classification'],
  'Campaign Priority': ['campaign priority', 'priority', 'importance'],
  'Last Update': ['last update', 'financial cycle', 'cycle', 'period', 'fiscal period', 'fiscal cycle', 'upload date', 'date uploaded'],
  'Last Modified By': ['last modified by', 'modified by', 'updated by', 'editor']
};

// Function to suggest field mappings based on CSV headers
function suggestFieldMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  // Normalize headers for comparison
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // First pass: exact matches
  expectedFields.forEach(expectedField => {
    const normalizedExpected = expectedField.toLowerCase();
    const exactMatchIndex = normalizedHeaders.findIndex(h => h === normalizedExpected);
    
    if (exactMatchIndex !== -1) {
      mappings[headers[exactMatchIndex]] = expectedField;
    }
  });
  
  // Second pass: check variations
  headers.forEach(header => {
    if (mappings[header]) return; // Skip if already mapped
    
    const normalizedHeader = header.toLowerCase().trim();
    
    for (const [expectedField, variations] of Object.entries(fieldVariations)) {
      if (variations.some(v => normalizedHeader === v || normalizedHeader.includes(v))) {
        mappings[header] = expectedField;
        break;
      }
    }
  });
  
  // Third pass: fuzzy matching for remaining fields
  headers.forEach(header => {
    if (mappings[header]) return; // Skip if already mapped
    
    const normalizedHeader = header.toLowerCase().trim();
    
    // Find the best match based on string similarity
    let bestMatch = '';
    let highestSimilarity = 0;
    
    expectedFields.forEach(expectedField => {
      // Skip if this expected field is already mapped to another header
      if (Object.values(mappings).includes(expectedField)) return;
      
      const similarity = calculateStringSimilarity(normalizedHeader, expectedField.toLowerCase());
      
      if (similarity > highestSimilarity && similarity > 0.6) { // Threshold for similarity
        highestSimilarity = similarity;
        bestMatch = expectedField;
      }
    });
    
    if (bestMatch) {
      mappings[header] = bestMatch;
    }
  });
  
  return mappings;
}

// Simple string similarity calculation (Jaccard index)
function calculateStringSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Function to transform data based on field mappings
function transformData(data: any[], fieldMappings: Record<string, string>): any[] {
  return data.map(record => {
    const transformedRecord: Record<string, any> = {};
    
    // Apply mappings
    Object.entries(record).forEach(([originalField, value]) => {
      const mappedField = fieldMappings[originalField];
      if (mappedField) {
        transformedRecord[mappedField] = value;
      } else {
        // Keep unmapped fields as is
        transformedRecord[originalField] = value;
      }
    });
    
    return transformedRecord;
  });
}

// Handle POST request for enhanced validation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Create a persistent file to store the uploaded CSV
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionId = uuidv4();
    const filePath = path.join(dataDir, `${sessionId}-${file.name}`);
    
    // Ensure the directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Write the file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    
    // Parse the CSV file
    const csvContent = await fs.readFile(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }
    
    // Get original headers from the CSV
    const headers = Object.keys(records[0]);
    
    // Suggest field mappings
    const suggestedMappings = suggestFieldMappings(headers);
    
    // Transform data based on suggested mappings
    const transformedData = transformData(records, suggestedMappings);
    
    // Fetch master data for validation
    // Use try/catch to handle any errors with individual queries
    let masterData: {
      countries: any[],
      categories: any[],
      ranges: any[],
      mediaTypes: any[],
      mediaSubTypes: any[],
      businessUnits: any[],
      pmTypes: any[],
      campaigns: any[]
    } = {
      countries: [],
      categories: [],
      ranges: [],
      mediaTypes: [],
      mediaSubTypes: [],
      businessUnits: [],
      pmTypes: [],
      campaigns: []
    };
    
    // Wrap each query in a try/catch to handle potential errors
    try {
      // Create a simple wrapper to safely execute Prisma queries
      const safeQuery = async (queryFn: () => Promise<any>, fallback: any = []) => {
        try {
          return await queryFn();
        } catch (error) {
          console.error(`Error executing query:`, error);
          return fallback;
        }
      };

      // Fetch all master data with safe queries
      // Using type assertions to help TypeScript understand these properties exist
      const prismaAny = prisma as any;
      
      const [countries, categories, ranges, mediaTypes, mediaSubTypes, businessUnits, pmTypes, campaigns] = 
        await Promise.all([
          safeQuery(() => prisma.country.findMany()),
          safeQuery(() => prisma.category.findMany()),
          safeQuery(() => prisma.range.findMany()),
          safeQuery(() => prisma.mediaType.findMany()),
          safeQuery(() => prisma.mediaSubType.findMany()),
          safeQuery(() => prismaAny.businessUnit.findMany(), [
            { id: 1, name: 'Nivea' },
            { id: 2, name: 'Derma' }
          ]),
          safeQuery(() => prismaAny.pMType.findMany()),
          safeQuery(() => prisma.campaign.findMany())
        ]);
      
      // Assign the results to masterData
      masterData.countries = countries;
      masterData.categories = categories;
      masterData.ranges = ranges;
      masterData.mediaTypes = mediaTypes;
      masterData.mediaSubTypes = mediaSubTypes;
      masterData.businessUnits = businessUnits;
      masterData.pmTypes = pmTypes;
      masterData.campaigns = campaigns;
      
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
    
    // Create a validator with the master data
    const validator = new MediaSufficiencyValidator(masterData);
    
    // Validate the transformed data - properly await the Promise
    const validationIssues = await validator.validateAll(transformedData);
    
    // Generate validation summary
    const validationSummary = validator.getValidationSummary(validationIssues);
    
    // Store session data
    const sessionData: SessionData = {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      filePath,
      recordCount: records.length,
      createdAt: new Date(),
      masterData,
      fieldMappings: suggestedMappings
    };
    
    // Save session data to a persistent file
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    await fs.writeFile(sessionFilePath, JSON.stringify({
      sessionData,
      records: transformedData,
      validationIssues,
      validationSummary,
      status: 'validated'
    }));
    
    return NextResponse.json({
      success: true,
      sessionId,
      fileName: file.name,
      recordCount: records.length,
      fieldMappings: suggestedMappings,
      originalHeaders: headers,
      expectedFields,
      validationSummary,
      validationIssues: Array.isArray(validationIssues) ? validationIssues.slice(0, 100) : [] // Limit initial issues for performance and ensure it's an array
    });
    
  } catch (error) {
    console.error('Error processing CSV file:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process CSV file' 
    }, { status: 500 });
  }
}
