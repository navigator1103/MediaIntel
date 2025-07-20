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
  countrySubRegions: Map<number, number | null>; // Map of countryId to subRegionId
  subRegions: Map<string, number>; // Map of subRegion name to id
  mediaSubTypeToMediaType: Map<number, string>; // Map of mediaSubTypeId to mediaType name
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
    // validateRequiredColumns is already handled by validateRequiredFields
    
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
  const [countries, categories, ranges, campaigns, mediaSubTypes, lastUpdates, subRegions] = await Promise.all([
    prisma.country.findMany({ include: { subRegion: true } }),
    prisma.category.findMany(),
    prisma.range.findMany(),
    prisma.campaign.findMany(),
    prisma.mediaSubType.findMany({ include: { mediaType: true } }),
    prisma.lastUpdate.findMany(),
    prisma.subRegion.findMany()
  ]);

  return {
    countries: new Map(countries.map(c => [c.name, c.id])),
    categories: new Map(categories.map(c => [c.name, c.id])),
    ranges: new Map(ranges.map(r => [r.name, r.id])),
    campaigns: new Map(campaigns.map(c => [c.name, c.id])),
    mediaSubTypes: new Map(mediaSubTypes.map(m => [m.name, m.id])),
    lastUpdates: new Map(lastUpdates.map(l => [l.name, l.id])),
    countrySubRegions: new Map(countries.map(c => [c.id, c.subRegionId])),
    subRegions: new Map(subRegions.map(s => [s.name, s.id])),
    mediaSubTypeToMediaType: new Map(mediaSubTypes.map(m => [m.id, m.mediaType?.name || 'Unknown']))
  };
}

function validateRecord(
  record: any, 
  rowNumber: number, 
  context: ValidationContext,
  selectedCountry: string
): string[] {
  const errors: string[] = [];

  // Check required fields with flexible column name handling
  // Note: Country and Year are not required here as they can be auto-populated
  const requiredFields = [
    { field: 'Category', getValue: (r: any) => r.Category },
    { field: 'Range', getValue: (r: any) => r.Range },
    { field: 'Campaign', getValue: (r: any) => r.Campaign },
    { field: 'Campaign Archetype', getValue: (r: any) => r['Campaign Archetype'] },
    { field: 'Media', getValue: (r: any) => r.Media || r['Media Type'] },
    { field: 'Media Subtype', getValue: (r: any) => r['Media Subtype'] || r['Media Sub Type'] },
    { field: 'Initial Date', getValue: (r: any) => r['Initial Date'] || r['Start Date'] },
    { field: 'End Date', getValue: (r: any) => r['End Date'] },
    { field: 'Total Budget', getValue: (r: any) => r['Total Budget'] || r.Budget },
    { field: 'Burst', getValue: (r: any) => r.Burst }
  ];
  
  for (const { field, getValue } of requiredFields) {
    const value = getValue(record);
    if (!value || value.toString().trim() === '') {
      errors.push(`Row ${rowNumber}: Missing required field '${field}'`);
    }
  }

  // Note: Campaigns can be new, so we don't validate their existence
  // They will be created during import if they don't exist

  // Note: Ranges can be new, so we don't validate their existence
  // They will be created during import if they don't exist

  // Validate Media Subtype exists (with flexible column naming)
  const mediaSubtypeValue = record['Media Subtype'] || record['Media Sub Type'];
  if (mediaSubtypeValue && !context.mediaSubTypes.has(mediaSubtypeValue)) {
    errors.push(`Row ${rowNumber}: Media Subtype '${mediaSubtypeValue}' not found in database`);
  }

  // Note: Categories can be new, so we don't validate their existence
  // They will be created during import if they don't exist

  // Validate date formats  
  const initialDate = record['Initial Date'] || record['Start Date'];
  if (initialDate) {
    const startDate = parseDate(initialDate);
    if (!startDate) {
      errors.push(`Row ${rowNumber}: Invalid initial date format '${initialDate}'`);
    }
  }

  if (record['End Date']) {
    const endDate = parseDate(record['End Date']);
    if (!endDate) {
      errors.push(`Row ${rowNumber}: Invalid end date format '${record['End Date']}'`);
    }
  }

  // Validate date range
  const initialDateValue = record['Initial Date'] || record['Start Date'];
  if (initialDateValue && record['End Date']) {
    const startDate = parseDate(initialDateValue);
    const endDate = parseDate(record['End Date']);
    if (startDate && endDate && startDate >= endDate) {
      errors.push(`Row ${rowNumber}: Initial date must be before end date`);
    }
  }

  // Validate sub-region belongs to the selected country
  const subRegionValue = record['Sub Region'] || record['Sub-Region'] || record.SUBREGION || record['Sub_Region'];
  console.log(`Row ${rowNumber}: Checking sub-region validation - subRegion: '${subRegionValue}', country: '${selectedCountry}'`);
  
  if (subRegionValue && selectedCountry) {
    const countryId = context.countries.get(selectedCountry);
    const subRegionId = context.subRegions.get(subRegionValue);
    
    console.log(`Row ${rowNumber}: countryId: ${countryId}, subRegionId: ${subRegionId}`);
    
    if (countryId && subRegionId) {
      const expectedSubRegionId = context.countrySubRegions.get(countryId);
      console.log(`Row ${rowNumber}: expectedSubRegionId: ${expectedSubRegionId}, actual: ${subRegionId}`);
      
      if (expectedSubRegionId && expectedSubRegionId !== subRegionId) {
        // Find the expected sub-region name
        let expectedSubRegionName = 'None';
        for (const [name, id] of context.subRegions.entries()) {
          if (id === expectedSubRegionId) {
            expectedSubRegionName = name;
            break;
          }
        }
        console.log(`Row ${rowNumber}: SUB-REGION MISMATCH DETECTED! Expected: '${expectedSubRegionName}', Got: '${subRegionValue}'`);
        errors.push(`Row ${rowNumber}: Sub-region '${subRegionValue}' does not belong to country '${selectedCountry}'. Expected sub-region: '${expectedSubRegionName}'. This is a critical error that will cause data inconsistency.`);
      }
    } else if (subRegionValue && !context.subRegions.has(subRegionValue)) {
      console.log(`Row ${rowNumber}: Sub-region '${subRegionValue}' not found in database`);
      errors.push(`Row ${rowNumber}: Sub-region '${subRegionValue}' not found in database`);
    }
  }

  // Validate Burst is a valid positive integer
  const burstValue = record.Burst;
  if (burstValue && burstValue.toString().trim() !== '') {
    const burstNumber = parseInt(burstValue.toString().trim(), 10);
    if (isNaN(burstNumber) || burstNumber < 1) {
      errors.push(`Row ${rowNumber}: Burst must be a positive integer (1 or greater). Current value: '${burstValue}'`);
    }
  }

  // Validate Total R1+ is mandatory for Digital, Open TV, and OOH media types
  if (mediaSubtypeValue) {
    const mediaSubtypeId = context.mediaSubTypes.get(mediaSubtypeValue);
    if (mediaSubtypeId) {
      const mediaTypeName = context.mediaSubTypeToMediaType.get(mediaSubtypeId);
      const normalizedSubtype = mediaSubtypeValue.toLowerCase();
      
      // Check if it's Digital, Open TV, or OOH (Traditional)
      const requiresR1Plus = mediaTypeName === 'Digital' || 
                            normalizedSubtype.includes('open tv') || 
                            normalizedSubtype.includes('ooh') ||
                            normalizedSubtype.includes('out of home') ||
                            normalizedSubtype.includes('outdoor');
      
      if (requiresR1Plus) {
        // Check for Total R1+ field with various possible column names
        const totalR1Plus = record['Total R1+'] || record['Total R1+ (%)'] || record['Total R1 Plus'] || record['TotalR1+'] || 
                           record['Total_R1_Plus'] || record['TOTALR1+'] || record['totalr1+'];
        
        if (!totalR1Plus || totalR1Plus.toString().trim() === '') {
          const mediaTypeDesc = mediaTypeName === 'Digital' ? 'digital' : 'traditional';
          errors.push(`Row ${rowNumber}: Total R1+ is mandatory for ${mediaTypeDesc} media type '${mediaSubtypeValue}'. Please provide a value in the 'Total R1+' column.`);
        } else {
          // Validate that it's a valid percentage (0-100% or 0-1 decimal)
          const numericValue = parseFloat(totalR1Plus.toString().replace(/[^0-9.\-]/g, ''));
          if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
            errors.push(`Row ${rowNumber}: Total R1+ value '${totalR1Plus}' is invalid for media type '${mediaSubtypeValue}'. Must be between 0-100% or 0-1.0.`);
          }
        }
      }
    }
  }

  // Validate TRP is only for TV media types (Open TV, Paid TV)
  if (mediaSubtypeValue) {
    const trpValue = record['TRPs'] || record['Total TRPs'] || record['TRP'];
    if (trpValue && trpValue.toString().trim() !== '') {
      const normalizedSubtype = mediaSubtypeValue.toLowerCase();
      const isTVMediaType = normalizedSubtype.includes('tv') || 
                           normalizedSubtype.includes('television');
      
      if (!isTVMediaType) {
        errors.push(`Row ${rowNumber}: TRP values can only be used with TV media types (Open TV, Paid TV). Media subtype '${mediaSubtypeValue}' is not a TV media type.`);
      }
    }
  }

  // Validate Media Subtype and PM Type combinations
  const pmTypeValue = record['PM Type'];
  if (mediaSubtypeValue && pmTypeValue) {
    const normalizedSubtype = mediaSubtypeValue.toLowerCase();
    const normalizedPmType = pmTypeValue.toString().trim();
    
    // Define valid combinations
    const validCombinations: Record<string, string[]> = {
      // Digital combinations
      'pm & ff': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced'],
      'influencers amplification': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
      'influencers amp.': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
      'influencers organic': ['Non PM'],
      'influencers org.': ['Non PM'],
      'other digital': ['Non PM'],
      'others': ['Non PM', 'GR Only'],
      'paid search': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
      'search': ['GR Only'],
      // Traditional combinations
      'open tv': ['Non PM'],
      'paid tv': ['Non PM'],
      'ooh': ['Non PM'],
      'radio': ['Non PM']
    };
    
    // Find matching rule
    let allowedPmTypes: string[] = [];
    for (const [subtypePattern, pmTypes] of Object.entries(validCombinations)) {
      if (normalizedSubtype.includes(subtypePattern) || 
          (subtypePattern === 'ooh' && (normalizedSubtype.includes('out of home') || normalizedSubtype.includes('outdoor')))) {
        allowedPmTypes = pmTypes;
        break;
      }
    }
    
    // If we found a rule, validate against it
    if (allowedPmTypes.length > 0) {
      const isValid = allowedPmTypes.some(allowed => 
        allowed.toLowerCase() === normalizedPmType.toLowerCase()
      );
      
      if (!isValid) {
        errors.push(`Row ${rowNumber}: PM Type '${pmTypeValue}' is not valid for Media Subtype '${mediaSubtypeValue}'. Allowed PM Types: ${allowedPmTypes.join(', ')}.`);
      }
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

  // Define the exact allowed columns as specified by the user
  const allowedColumns = [
    'Category', 'Range', 'Campaign', 'Playbook ID', 'Campaign Archetype', 'Burst',
    'Media', 'Media Subtype', 'Initial Date', 'End Date', 'Total Weeks', 'Total Budget',
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'Total WOA', 'Total WOFF', 'Total R1+ (%)', 'Total R3+ (%)',
    // Optional fields (conditional or auto-populated)
    'Total TRPs', 'Country', 'Last Update', 'Year', 'PM Type'
  ];

  // Define accepted variations for column names
  const columnVariations: Record<string, string[]> = {
    'Media': ['Media', 'Media Type'],
    'Media Subtype': ['Media Subtype', 'Media Sub Type'],
    'Initial Date': ['Initial Date', 'Start Date'],
    'Total WOA': ['Total WOA', 'Weeks Off Air', 'Total WOFF'],
    'Total WOFF': ['Total WOFF', 'W Off Air', 'Total WOA'],
    'Total TRPs': ['Total TRPs', 'TRPs'],
    'Total R1+ (%)': ['Total R1+ (%)', 'Total R1+', 'R1+'],
    'Total R3+ (%)': ['Total R3+ (%)', 'Total R3+', 'R3+']
  };
  
  const firstRecord = records[0];
  const actualColumns = Object.keys(firstRecord);
  const missingColumns: string[] = [];
  const extraColumns: string[] = [];
  
  // Check for missing required columns with flexible handling for known variations
  for (const column of allowedColumns) {
    // Skip optional fields (auto-populated or conditional)
    if (['Total TRPs', 'Country', 'Last Update', 'Year', 'PM Type'].includes(column)) {
      continue;
    }
    
    let columnFound = false;
    const variations = columnVariations[column] || [column];
    
    for (const variation of variations) {
      if (variation in firstRecord) {
        columnFound = true;
        break;
      }
    }
    
    if (!columnFound) {
      missingColumns.push(`'${column}'`);
      result.isValid = false;
    }
  }
  
  // Check for extra columns that are not allowed
  for (const actualColumn of actualColumns) {
    let isAllowed = false;
    
    // Check if column is directly allowed
    if (allowedColumns.includes(actualColumn)) {
      isAllowed = true;
    } else {
      // Check if column matches any variation
      for (const [standardName, variations] of Object.entries(columnVariations)) {
        if (variations.includes(actualColumn)) {
          isAllowed = true;
          break;
        }
      }
    }
    
    if (!isAllowed) {
      extraColumns.push(`'${actualColumn}'`);
      result.isValid = false;
    }
  }
  
  // Report missing columns
  if (missingColumns.length > 0) {
    result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Report extra columns
  if (extraColumns.length > 0) {
    result.errors.push(`Extra columns not allowed: ${extraColumns.join(', ')}`);
    result.errors.push(`Only these columns are allowed: ${allowedColumns.join(', ')}`);
  }
}

