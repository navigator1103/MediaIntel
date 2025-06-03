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
    
    // Parse the CSV file with streaming approach for large files
    const csvContent = await fs.readFile(filePath, 'utf-8');
    
    // Add a size check to warn about very large files
    if (csvContent.length > 10 * 1024 * 1024) { // 10MB
      console.warn(`Processing large file (${(csvContent.length / (1024 * 1024)).toFixed(2)}MB). This may take some time.`);
    }
    
    // Parse with a more memory-efficient approach
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // Increase the max number of records to avoid parser errors on large files
      max_record_size: 0 // 0 means no limit
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
      campaigns: any[],
      mediaToSubtypes?: Record<string, string[]>,
      categoryToRanges?: Record<string, string[]>
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
      
      // Create media type to subtype mapping for validation
      const mediaToSubtypes: Record<string, string[]> = {};
      
      // Populate the mapping from the database relationships
      if (mediaTypes && mediaSubTypes) {
        // Create a map of media type IDs to names for quick lookup
        const mediaTypeMap = new Map<number, string>();
        mediaTypes.forEach((mediaType: any) => {
          if (mediaType && mediaType.id && mediaType.name) {
            mediaTypeMap.set(mediaType.id, mediaType.name);
          }
        });
        
        // Group subtypes by their parent media type
        mediaSubTypes.forEach((subtype: any) => {
          if (subtype && subtype.mediaTypeId && subtype.name) {
            const mediaTypeName = mediaTypeMap.get(subtype.mediaTypeId);
            if (mediaTypeName) {
              if (!mediaToSubtypes[mediaTypeName]) {
                mediaToSubtypes[mediaTypeName] = [];
              }
              mediaToSubtypes[mediaTypeName].push(subtype.name);
            }
          }
        });
        
        // Associate TV subtypes with Traditional media type
        if (mediaToSubtypes['TV'] && mediaToSubtypes['TV'].length > 0) {
          if (!mediaToSubtypes['Traditional']) {
            mediaToSubtypes['Traditional'] = [];
          }
          
          // Add all TV subtypes to Traditional
          mediaToSubtypes['Traditional'] = [
            ...mediaToSubtypes['Traditional'],
            ...mediaToSubtypes['TV']
          ];
          
          // Remove duplicates if any
          mediaToSubtypes['Traditional'] = [...new Set(mediaToSubtypes['Traditional'])];
          
          console.log('Associated TV subtypes with Traditional:', mediaToSubtypes['Traditional']);
        }
      }
      
      // Add the mapping to masterData for validation
      masterData.mediaToSubtypes = mediaToSubtypes;
      
      console.log('Media to subtypes mapping for validation:', mediaToSubtypes);
      
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
    
    // Create a validator with the master data
    const validator = new MediaSufficiencyValidator(masterData);
    
    // Process records in chunks for large datasets
    const CHUNK_SIZE = 1000; // Process 1000 records at a time
    let validationIssues: any[] = [];
    
    // For very large datasets, use a different approach
    const isLargeDataset = transformedData.length > 5000;
    let totalIssueCount = 0;
    
    // Process data in chunks for large datasets
    if (transformedData.length > CHUNK_SIZE) {
      console.log(`Processing large dataset with ${transformedData.length} records in chunks of ${CHUNK_SIZE}`);
      
      for (let i = 0; i < transformedData.length; i += CHUNK_SIZE) {
        const chunk = transformedData.slice(i, i + CHUNK_SIZE);
        
        // Validate the chunk
        const chunkIssues = await validator.validateAll(chunk, i);
        
        // For large datasets, only keep a limited number of issues to avoid memory issues
        if (isLargeDataset) {
          totalIssueCount += chunkIssues.length;
          if (validationIssues.length < 500) {
            // Only add issues until we reach 500
            const remainingSlots = 500 - validationIssues.length;
            validationIssues.push(...chunkIssues.slice(0, remainingSlots));
          }
        } else {
          // For smaller datasets, keep all issues
          validationIssues.push(...chunkIssues);
        }
        
        // Log progress for monitoring
        console.log(`Processed chunk ${Math.floor(i / CHUNK_SIZE) + 1} of ${Math.ceil(transformedData.length / CHUNK_SIZE)}`);
        
        // Allow GC to reclaim memory between chunks
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } else {
      // For smaller datasets, process all at once
      validationIssues = await validator.validateAll(transformedData);
    }
    
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
    
    // For very large datasets, only return the summary and a limited set of issues
    // The client can fetch more issues as needed through pagination
    // isLargeDataset is already defined above
    
    return NextResponse.json({
      success: true,
      sessionId,
      fileName: file.name,
      recordCount: records.length,
      fieldMappings: suggestedMappings,
      originalHeaders: headers,
      expectedFields,
      validationSummary,
      // For large datasets, return even fewer initial issues to improve performance
      validationIssues: Array.isArray(validationIssues) 
        ? validationIssues.slice(0, isLargeDataset ? 50 : 100) 
        : [],
      isLargeDataset, // Flag to inform the client this is a large dataset
      totalIssueCount: isLargeDataset ? totalIssueCount : validationIssues.length // Use actual count for large datasets
    });
    
  } catch (error) {
    console.error('Error processing CSV file:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process CSV file' 
    }, { status: 500 });
  }
}
