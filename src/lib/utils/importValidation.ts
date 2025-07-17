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

  // Check required fields with flexible column name handling for Media Subtype
  const requiredFields = [
    { field: 'Campaign', getValue: (r: any) => r.Campaign },
    { field: 'Range', getValue: (r: any) => r.Range },
    { field: 'Media Subtype', getValue: (r: any) => r['Media Subtype'] || r['Media Sub Type'] },
    { field: 'Start Date', getValue: (r: any) => r['Start Date'] },
    { field: 'End Date', getValue: (r: any) => r['End Date'] },
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
        const totalR1Plus = record['Total R1+'] || record['Total R1 Plus'] || record['TotalR1+'] || 
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

  // Define all expected columns based on GamePlan model (required and optional)
  // Required columns for game plan creation
  const requiredColumns = ['Campaign', 'Range', 'Media Subtype', 'Start Date', 'End Date', 'Burst'];
  
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
    'Total TRPs',        // maps to totalTrps
    'Total R1+',         // maps to totalR1Plus
    'Total R3+',         // maps to totalR3Plus
    'Total WOA',         // maps to totalWoa
    'Weeks Off Air',     // maps to weeksOffAir (also accepts 'W Off Air')
    'W Off Air',         // alternative for weeksOffAir
    'NS vs WM',          // maps to nsVsWm
    
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
  const criticalErrors: string[] = [];
  const minorErrors: string[] = [];
  
  for (const actualColumn of actualColumns) {
    // Check if the column is not in expected columns (case-sensitive first)
    if (!allExpectedColumns.includes(actualColumn)) {
      // Try case-insensitive match to provide better suggestions
      const matchedColumn = allExpectedColumns.find(
        expected => expected.toLowerCase() === actualColumn.toLowerCase()
      );
      
      if (matchedColumn) {
        // Minor error - just capitalization issue
        minorErrors.push(`'${actualColumn}' (should be '${matchedColumn}' - check capitalization)`);
      } else {
        // Check for close matches and provide specific suggestions
        let closeSuggestion = '';
        let isCloseMatch = false;
        const lowerColumn = actualColumn.toLowerCase();
        
        if (lowerColumn.includes('subtype') || lowerColumn.includes('sub type')) {
          closeSuggestion = ` (did you mean 'Media Subtype'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('budget') && !actualColumn.includes('Q')) {
          closeSuggestion = ` (should this be 'Total Budget' or a quarterly budget like 'Q1 Budget'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('date') && lowerColumn.includes('start')) {
          closeSuggestion = ` (did you mean 'Start Date'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('date') && lowerColumn.includes('end')) {
          closeSuggestion = ` (did you mean 'End Date'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('reach')) {
          closeSuggestion = ` (should this be 'Reach 1+' or 'Reach 3+'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('trp')) {
          closeSuggestion = ` (did you mean 'TRPs'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('woa') || lowerColumn.includes('weeks off air')) {
          closeSuggestion = ` (did you mean 'Total WOA' or 'Weeks Off Air'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('pm') && lowerColumn.includes('type')) {
          closeSuggestion = ` (did you mean 'PM Type'?)`;
          isCloseMatch = true;
        } else if (lowerColumn.includes('playbook')) {
          closeSuggestion = ` (did you mean 'Playbook ID'?)`;
          isCloseMatch = true;
        }
        
        if (isCloseMatch) {
          // Close match - treat as recoverable error
          minorErrors.push(`'${actualColumn}'${closeSuggestion}`);
        } else {
          // Completely unrecognized column - critical error
          criticalErrors.push(`'${actualColumn}' (unrecognized column - please remove or rename)`);
        }
      }
    }
  }
  
  // Add all errors to extraColumns for reporting
  extraColumns.push(...criticalErrors, ...minorErrors);
  
  // Report missing columns
  if (missingColumns.length > 0) {
    result.errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  // Report extra columns as errors to prevent data loss
  if (extraColumns.length > 0) {
    result.errors.push(`Invalid columns found: ${extraColumns.join(', ')}`);
    result.errors.push(`Expected columns are: ${requiredColumns.join(', ')} (required) and ${optionalColumns.join(', ')} (optional)`);
    result.isValid = false;
  }
  
  // If there are issues, show what was found
  if (missingColumns.length > 0 || extraColumns.length > 0) {
    console.log('Columns found in CSV:', actualColumns.join(', '));
    console.log('Required columns:', requiredColumns.join(', '));
    console.log('Optional columns:', optionalColumns.join(', '));
  }
}

