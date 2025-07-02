import { PrismaClient } from '@prisma/client';

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

  // Check required fields
  const requiredFields = ['Campaign', 'Range', 'Media Subtype', 'Start Date', 'End Date'];
  for (const field of requiredFields) {
    if (!record[field] || record[field].toString().trim() === '') {
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

  // Validate Media Subtype exists
  if (record['Media Subtype'] && !context.mediaSubTypes.has(record['Media Subtype'])) {
    errors.push(`Row ${rowNumber}: Media Subtype '${record['Media Subtype']}' not found in database`);
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

  // Check if all records have the minimum required structure
  const requiredColumns = ['Campaign', 'Range', 'Media Subtype', 'Start Date', 'End Date'];
  const firstRecord = records[0];
  
  for (const column of requiredColumns) {
    if (!(column in firstRecord)) {
      result.errors.push(`Missing required column: '${column}'`);
      result.isValid = false;
    }
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Try different date formats
    let date: Date;
    
    if (dateStr.includes('/')) {
      // Handle DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        return null;
      }
    } else if (dateStr.includes('-')) {
      // Handle YYYY-MM-DD or DD-MM-YYYY format
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(dateStr);
        } else {
          // DD-MM-YYYY
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);
          date = new Date(year, month, day);
        }
      } else {
        return null;
      }
    } else {
      date = new Date(dateStr);
    }
    
    return date instanceof Date && !isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}