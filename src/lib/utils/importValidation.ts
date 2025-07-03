import { PrismaClient } from '@prisma/client';
import { parseDate } from './dateUtils';

const prisma = new PrismaClient();

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordCount: number;
  invalidRecords: number[];
}

interface ValidationContext {
  countries: Map<string, number>;
  categories: Map<string, number>;
  ranges: Map<string, number>;
  campaigns: Map<string, number>;
  mediaSubTypes: Map<string, number>;
  lastUpdates: Map<string, number>;
}

export async function preValidateImportData(
  records: any[],
  selectedCountry: string,
  lastUpdateId: number
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recordCount: records.length,
    invalidRecords: []
  };

  console.log('🔍 Pre-validating import data...');
  console.log(`   - Records to validate: ${records.length}`);
  console.log(`   - Selected country: ${selectedCountry}`);
  console.log(`   - LastUpdate ID: ${lastUpdateId}`);

  try {
    // Build validation context - get all existing entities
    const context = await buildValidationContext();

    // Validate each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordErrors = validateRecord(record, i + 1, context, selectedCountry);
      
      if (recordErrors.length > 0) {
        result.errors.push(...recordErrors);
        result.invalidRecords.push(i);
        result.isValid = false;
      }
    }

    // Additional validations
    validateRequiredFields(records, result);
    
    console.log(`✅ Pre-validation completed:`);
    console.log(`   - Valid: ${result.isValid}`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Invalid records: ${result.invalidRecords.length}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error during pre-validation:', error);
    result.isValid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

async function buildValidationContext(): Promise<ValidationContext> {
  const [countries, categories, ranges, campaigns, mediaSubTypes, lastUpdates] = await Promise.all([
    prisma.country.findMany(),
    prisma.category.findMany(),
    prisma.range.findMany(),
    prisma.campaign.findMany(),
    prisma.mediaSubType.findMany(),
    prisma.lastUpdate.findMany()
  ]);

  return {
    countries: new Map(countries.map(c => [c.name, c.id])),
    categories: new Map(categories.map(c => [c.name, c.id])),
    ranges: new Map(ranges.map(r => [r.name, r.id])),
    campaigns: new Map(campaigns.map(c => [c.name, c.id])),
    mediaSubTypes: new Map(mediaSubTypes.map(m => [m.name, m.id])),
    lastUpdates: new Map(lastUpdates.map(l => [l.name, l.id]))
  };
}

function validateRecord(
  record: any, 
  rowNumber: number, 
  context: ValidationContext,
  selectedCountry: string
): string[] {
  const errors: string[] = [];

  // Check required fields with flexible column name handling for Media Subtype
  const requiredFields = [
    { field: 'Campaign', getValue: (r: any) => r.Campaign },
    { field: 'Range', getValue: (r: any) => r.Range },
    { field: 'Media Subtype', getValue: (r: any) => r['Media Subtype'] || r['Media Sub Type'] },
    { field: 'Start Date', getValue: (r: any) => r['Start Date'] },
    { field: 'End Date', getValue: (r: any) => r['End Date'] }
  ];
  
  for (const { field, getValue } of requiredFields) {
    const value = getValue(record);
    if (!value || value.toString().trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
    }
  }

  // Validate Campaign exists
  if (record.Campaign && !context.campaigns.has(record.Campaign)) {
    errors.push(`Row ${rowNumber}: Campaign '${record.Campaign}' not found in database`);
  }

  // Validate Range exists
  if (record.Range && !context.ranges.has(record.Range)) {
    errors.push(`Row ${rowNumber}: Range '${record.Range}' not found in database`);
  }

  // Validate Media Subtype exists (with flexible column naming)
  const mediaSubtypeValue = record['Media Subtype'] || record['Media Sub Type'];
  if (mediaSubtypeValue && !context.mediaSubTypes.has(mediaSubtypeValue)) {
    errors.push(`Row ${rowNumber}: Media Subtype '${mediaSubtypeValue}' not found in database`);
  }

  // Validate Category exists (if provided)
  if (record.Category && !context.categories.has(record.Category)) {
    errors.push(`Row ${rowNumber}: Category '${record.Category}' not found in database`);
  }

  // Validate date formats
  if (record['Start Date']) {
    const startDate = parseDate(record['Start Date']);
    if (!startDate) {
      errors.push(`Row ${rowNumber}: Invalid start date format '${record['Start Date']}'`);
    }
  }

  if (record['End Date']) {
    const endDate = parseDate(record['End Date']);
    if (!endDate) {
      errors.push(`Row ${rowNumber}: Invalid end date format '${record['End Date']}'`);
    }
  }

  // Validate date range
  if (record['Start Date'] && record['End Date']) {
    const startDate = parseDate(record['Start Date']);
    const endDate = parseDate(record['End Date']);
    if (startDate && endDate && startDate >= endDate) {
      errors.push(`Row ${rowNumber}: Start date must be before end date`);
    }
  }

  return errors;
}

function validateRequiredFields(records: any[], result: ValidationResult): void {
  if (records.length === 0) {
    result.errors.push('No records found in the import file');
    result.isValid = false;
    return;
  }

  // Define all expected columns based on GamePlan model (required and optional)
  // Required columns for game plan creation
  const requiredColumns = ['Campaign', 'Range', 'Media Subtype', 'Start Date', 'End Date'];
  
  // Optional columns that map to GamePlan fields
  const optionalColumns = [
    // Core fields
    'Country',           // maps to countryId
    'Category',          // maps to category_id  
    'PM Type',           // maps to pmTypeId
    'Year',              // maps to year
    'Playbook ID',       // maps to playbook_id
    'Burst',             // maps to burst
    
    // Budget fields
    'Total Budget',      // maps to totalBudget
    'Q1 Budget',         // maps to q1Budget
    'Q2 Budget',         // maps to q2Budget
    'Q3 Budget',         // maps to q3Budget
    'Q4 Budget',         // maps to q4Budget
    
    // Reach and performance fields
    'TRPs',              // maps to trps
    'Reach 1+',          // maps to reach1Plus
    'Reach 3+',          // maps to reach3Plus
    'Total WOA',         // maps to totalWoa
    'Weeks Off Air',     // maps to weeksOffAir
    
    // Reference fields
    'Business Unit',     // maps to business_unit_id
    'Region',            // maps to region_id
    'Sub Region',        // maps to sub_region_id
    'Financial Cycle',   // maps to last_update_id
    
    // Alternative column name variations that are accepted
    'Q1', 'Q2', 'Q3', 'Q4',                    // Alternative budget columns
    'Media Type',                               // Used to lookup Media Subtype
    'Media Sub Type',                           // Alternative to Media Subtype
    'Last Update',                              // Alternative to Financial Cycle
    'Range ID', 'Campaign ID', 'Country ID'    // Alternative ID references
  ];
  
  const firstRecord = records[0];
  const actualColumns = Object.keys(firstRecord);
  const missingColumns: string[] = [];
  const extraColumns: string[] = [];
  
  // Check for missing required columns with flexible handling
  for (const column of requiredColumns) {
    let columnFound = false;
    
    if (column === 'Media Subtype') {
      // Accept both variations
      columnFound = 'Media Subtype' in firstRecord || 'Media Sub Type' in firstRecord;
    } else {
      columnFound = column in firstRecord;
    }
    
    if (!columnFound) {
      // Check for common variations and provide helpful suggestions
      let suggestion = '';
      
      if (column === 'Media Subtype') {
        // Check for other variations
        if ('MediaSubtype' in firstRecord) {
          suggestion = ` (Found 'MediaSubtype' - please rename to 'Media Subtype')`;
        } else if ('Media_Subtype' in firstRecord) {
          suggestion = ` (Found 'Media_Subtype' - please rename to 'Media Subtype')`;
        } else if ('SubType' in firstRecord) {
          suggestion = ` (Found 'SubType' - please rename to 'Media Subtype')`;
        }
      } else if (column === 'Start Date') {
        if ('StartDate' in firstRecord) {
          suggestion = ` (Found 'StartDate' - please rename to 'Start Date')`;
        } else if ('Start_Date' in firstRecord) {
          suggestion = ` (Found 'Start_Date' - please rename to 'Start Date')`;
        }
      } else if (column === 'End Date') {
        if ('EndDate' in firstRecord) {
          suggestion = ` (Found 'EndDate' - please rename to 'End Date')`;
        } else if ('End_Date' in firstRecord) {
          suggestion = ` (Found 'End_Date' - please rename to 'End Date')`;
        }
      } else if (column === 'Total Budget') {
        if ('TotalBudget' in firstRecord) {
          suggestion = ` (Found 'TotalBudget' - please rename to 'Total Budget')`;
        } else if ('Budget' in firstRecord) {
          suggestion = ` (Found 'Budget' - please rename to 'Total Budget')`;
        }
      }
      
      missingColumns.push(`'${column}'${suggestion}`);
      result.isValid = false;
    }
  }
  
  // Check for unexpected/extra columns
  const allExpectedColumns = [...requiredColumns, ...optionalColumns];
  for (const actualColumn of actualColumns) {
    // Check if the column is not in expected columns (case-sensitive first)
    if (!allExpectedColumns.includes(actualColumn)) {
      // Try case-insensitive match to provide better suggestions
      const matchedColumn = allExpectedColumns.find(
        expected => expected.toLowerCase() === actualColumn.toLowerCase()
      );
      
      if (matchedColumn) {
        extraColumns.push(`'${actualColumn}' (should be '${matchedColumn}' - check capitalization)`);
      } else {
        // Check for close matches and provide specific suggestions
        let closeSuggestion = '';
        const lowerColumn = actualColumn.toLowerCase();
        
        if (lowerColumn.includes('subtype') || lowerColumn.includes('sub type')) {
          closeSuggestion = ` (did you mean 'Media Subtype'?)`;
        } else if (lowerColumn.includes('budget') && !actualColumn.includes('Q')) {
          closeSuggestion = ` (should this be 'Total Budget' or a quarterly budget like 'Q1 Budget'?)`;
        } else if (lowerColumn.includes('date') && lowerColumn.includes('start')) {
          closeSuggestion = ` (did you mean 'Start Date'?)`;
        } else if (lowerColumn.includes('date') && lowerColumn.includes('end')) {
          closeSuggestion = ` (did you mean 'End Date'?)`;
        } else if (lowerColumn.includes('reach')) {
          closeSuggestion = ` (should this be 'Reach 1+' or 'Reach 3+'?)`;
        } else if (lowerColumn.includes('trp')) {
          closeSuggestion = ` (did you mean 'TRPs'?)`;
        } else if (lowerColumn.includes('woa') || lowerColumn.includes('weeks off air')) {
          closeSuggestion = ` (did you mean 'Total WOA' or 'Weeks Off Air'?)`;
        } else if (lowerColumn.includes('pm') && lowerColumn.includes('type')) {
          closeSuggestion = ` (did you mean 'PM Type'?)`;
        } else if (lowerColumn.includes('playbook')) {
          closeSuggestion = ` (did you mean 'Playbook ID'?)`;
        }
        extraColumns.push(`'${actualColumn}'${closeSuggestion}`);
      }
    }
  }
  
  // Report missing columns
  if (missingColumns.length > 0) {
    result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Report extra columns as warnings
  if (extraColumns.length > 0) {
    result.warnings.push(`Unexpected columns found (these will be ignored): ${extraColumns.join(', ')}`);
    result.warnings.push(`Expected columns are: ${requiredColumns.join(', ')} (required) and ${optionalColumns.join(', ')} (optional)`);
  }
  
  // If there are issues, show what was found
  if (missingColumns.length > 0 || extraColumns.length > 0) {
    console.log('Columns found in CSV:', actualColumns.join(', '));
    console.log('Required columns:', requiredColumns.join(', '));
    console.log('Optional columns:', optionalColumns.join(', '));
  }
}

