import { ValidationIssue } from '@/components/media-sufficiency/DataPreviewGrid';

// Define master data interface for better type safety
interface MasterData {
  mediaTypes?: string[];
  categories?: string[];
  ranges?: string[];
  categoryToRanges?: Record<string, string[]>;
  rangeToCategories?: Record<string, string[]>;
  mediaToSubtypes?: Record<string, Array<string | { name: string }>>;
  records?: any[];
  [key: string]: any;
}

// Define record type for media sufficiency data
export interface MediaSufficiencyRecord {
  [key: string]: any;
  Year?: string | number;
  'Sub Region'?: string;
  Country?: string;
  Category?: string;
  Range?: string;
  Campaign?: string;
  Media?: string;
  'Media Subtype'?: string;
  'Start Date'?: string | Date;
  'End Date'?: string | Date;
  Budget?: string | number;
  'Q1 Budget'?: string | number;
  'Q2 Budget'?: string | number;
  'Q3 Budget'?: string | number;
  'Q4 Budget'?: string | number;
  'PM Type'?: string;
  'Objectives Values'?: string;
}

// Define validation rule types
export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'relationship' | 'uniqueness' | 'range' | 'consistency';
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  validate: (value: any, record: MediaSufficiencyRecord, allRecords: MediaSufficiencyRecord[], masterData?: MasterData) => boolean | Promise<boolean>;
}

// Define the validator class
export class MediaSufficiencyValidator {
  private rules: ValidationRule[] = [];
  private masterData: MasterData = {};

  constructor(masterData?: MasterData) {
    if (masterData) {
      this.masterData = masterData;
    }
    this.initializeRules();
  }

  // Helper function to parse numbers
  private parseNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    
    // If it's already a number, return it
    if (typeof value === 'number') return value;
    
    // Try to parse the string as a number
    const parsed = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  
  // Use the shared date utility for consistent date parsing
  private parseDate(value: any): Date | null {
    if (!value) return null;
    
    // If it's already a Date object, return it
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    
    // Use the shared date utility
    const { parseDate } = require('@/lib/utils/dateUtils');
    return parseDate(value);
  }
  
  // Format dates using the shared utility
  private formatDate(date: Date | string | number | null): string {
    if (!date) return '';
    
    // Use the shared date utility
    const { formatDateForStorage } = require('@/lib/utils/dateUtils');
    return formatDateForStorage(date) || '';
  }
  
  // Initialize default validation rules
  private initializeRules() {
    // Define all fields that should be validated
    const allFields = [
      'Year', 'Sub Region', 'Country', 'Category', 'Range', 'Campaign', 'Media', 'Media Subtype', 
      'Start Date', 'End Date', 'Budget', 'Q1 Budget', 'Q2 Budget', 'Q3 Budget', 'Q4 Budget',
      'PM Type', 'Objectives Values'
    ];
    
    // Fields that are required (critical if missing)
    const requiredFields = [
      'Year', 'Country', 'Category', 'Range', 'Campaign', 'Media', 'Media Subtype', 
      'Start Date', 'End Date', 'Budget'
    ];
    
    // Add validation for required fields (critical)
    requiredFields.forEach(field => {
      this.rules.push({
        field,
        type: 'required',
        severity: 'critical',
        message: `${field} is required`,
        validate: (value) => {
          return value !== undefined && value !== null && value.toString().trim() !== '';
        }
      });
    });
    
    // Add explicit validation for blank quarterly budget fields (warning)
    const budgetFields = ['Q1 Budget', 'Q2 Budget', 'Q3 Budget', 'Q4 Budget'];
    
    budgetFields.forEach(field => {
      this.rules.push({
        field,
        type: 'required',
        severity: 'warning',
        message: `${field} is blank`,
        validate: (value, record) => {
          console.log(`Validating blank ${field}:`, value);
          // Consider empty strings, null, undefined, and whitespace-only as blank
          const isBlank = value === undefined || value === null || value.toString().trim() === '';
          console.log(`${field} is blank:`, isBlank);
          return !isBlank; // Return false if blank to trigger the warning
        }
      });
    });
    
    // Add validation for other non-required fields (warning)
    allFields
      .filter(field => !requiredFields.includes(field) && !budgetFields.includes(field))
      .forEach(field => {
        this.rules.push({
          field,
          type: 'required',
          severity: 'warning',
          message: `${field} is blank`,
          validate: (value) => {
            return value !== undefined && value !== null && value.toString().trim() !== '';
          }
        });
      });

    // Year format validation
    this.rules.push({
      field: 'Year',
      type: 'format',
      severity: 'critical',
      message: 'Year must be a valid 4-digit year',
      validate: (value) => {
        if (!value) return false;
        const year = parseInt(value.toString());
        return !isNaN(year) && year >= 2000 && year <= 2100;
      }
    });

    // Date format validation
    const dateFields = ['Start Date', 'End Date'];
    dateFields.forEach(field => {
      this.rules.push({
        field,
        type: 'format',
        severity: 'critical',
        message: `${field} must be a valid date`,
        validate: (value) => {
          if (!value) return false;
          
          // Try parsing different date formats
          const date = this.parseDate(value);
          return date !== null;
        }
      });
    });

    // Sub Region validation
    this.rules.push({
      field: 'Sub Region',
      type: 'relationship',
      severity: 'warning',
      message: 'Sub Region should be a valid region name',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return true; // Sub Region is not required
        
        // Check if sub region exists in master data
        const subRegionInput = value.toString().trim();
        const subRegions = masterData?.subRegions || [];
        
        // Case-insensitive search with type checking
        return subRegions.some((sr: string | { name: string }) => {
          // Ensure sr is a string before calling toLowerCase
          if (typeof sr === 'string') {
            return sr.toLowerCase() === subRegionInput.toLowerCase();
          }
          // If sr is an object with a name property, use that
          if (sr && typeof sr === 'object' && 'name' in sr && typeof sr.name === 'string') {
            return sr.name.toLowerCase() === subRegionInput.toLowerCase();
          }
          // If sr is not a string or object with name, compare directly
          return sr === subRegionInput;
        });
      }
    });

    // Country validation
    this.rules.push({
      field: 'Country',
      type: 'relationship',
      severity: 'critical',
      message: 'Country must be a valid country name',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if country exists in master data
        const countryInput = value.toString().trim();
        const countries = masterData?.countries || [];
        
        // Case-insensitive search with type checking
        return countries.some((c: string | { name: string }) => {
          // Ensure c is a string before calling toLowerCase
          if (typeof c === 'string') {
            return c.toLowerCase() === countryInput.toLowerCase();
          }
          // If c is an object with a name property, use that
          if (c && typeof c === 'object' && 'name' in c && typeof c.name === 'string') {
            return c.name.toLowerCase() === countryInput.toLowerCase();
          }
          // If c is not a string or object with name, compare directly
          return c === countryInput;
        });
      }
    });
    
    // Sub Region to Country mapping validation
    this.rules.push({
      field: 'Country',
      type: 'relationship',
      severity: 'critical',
      message: 'Country does not match the specified Sub Region',
      validate: (value, record, allRecords, masterData) => {
        // Skip validation if either country or sub region is missing
        if (!value || !record['Sub Region']) return true;
        
        const countryInput = value.toString().trim();
        const subRegionInput = record['Sub Region'].toString().trim();
        
        // Get the mappings from master data
        const countryToSubRegionMap = masterData?.countryToSubRegionMap || {};
        const subRegionToCountriesMap = masterData?.subRegionToCountriesMap || {};
        
        // If we don't have any mapping data, skip validation
        if (Object.keys(countryToSubRegionMap).length === 0) {
          return true;
        }
        
        // Find the country in our mappings (case-insensitive)
        const countryKey = Object.keys(countryToSubRegionMap).find(
          key => key.toLowerCase() === countryInput.toLowerCase()
        );
        
        // If we found the country in our mappings
        if (countryKey) {
          const mappedSubRegion = countryToSubRegionMap[countryKey];
          // Check if the specified sub-region matches what's in our mapping
          return mappedSubRegion.toLowerCase() === subRegionInput.toLowerCase();
        }
        
        // If country isn't in our mappings, check if the sub-region exists
        const subRegionKey = Object.keys(subRegionToCountriesMap).find(
          key => key.toLowerCase() === subRegionInput.toLowerCase()
        );
        
        // If the sub-region exists in our mappings
        if (subRegionKey) {
          // Check if the country is in the list of countries for this sub-region
          const countries = subRegionToCountriesMap[subRegionKey];
          return countries.some((c: string) => c.toLowerCase() === countryInput.toLowerCase());
        }
        
        // If neither the country nor the sub-region is in our mappings, we can't validate
        // So we'll assume it's valid to avoid false positives
        return true;
      }
    });

    // Category validation
    this.rules.push({
      field: 'Category',
      type: 'relationship',
      severity: 'critical',
      message: 'Category must be a valid category name',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if category exists in master data
        const categoryInput = value.toString().trim();
        const categories = masterData?.categories || [];
        
        // Debug: Log the value being validated and available categories
        if (categoryInput.toLowerCase().includes('traditional')) {
          console.log('Validating category value:', categoryInput);
          console.log('Available categories:', categories);
          console.log('Categories as lowercase:', categories.map(c => {
            if (typeof c === 'string') return c.toLowerCase();
            if (c && typeof c === 'object' && 'name' in c && typeof (c as { name: string }).name === 'string') return (c as { name: string }).name.toLowerCase();
            return String(c);
          }));
        }
        
        // Case-insensitive search with type checking
        return categories.some((c: string | { name: string }) => {
          // Ensure c is a string before calling toLowerCase
          if (typeof c === 'string') {
            return c.toLowerCase() === categoryInput.toLowerCase();
          }
          // If c is an object with a name property, use that
          if (c && typeof c === 'object' && 'name' in c && typeof c.name === 'string') {
            return c.name.toLowerCase() === categoryInput.toLowerCase();
          }
          // If c is not a string or object with name, compare directly
          return c === categoryInput;
        });
      }
    });

    // Range validation
    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: 'critical',
      message: 'Range must be a valid range name',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if range exists in master data
        const rangeInput = value.toString().trim();
        const ranges = masterData?.ranges || [];
        
        // Case-insensitive search with type checking
        return ranges.some((r: string | { name: string }) => {
          // Ensure r is a string before calling toLowerCase
          if (typeof r === 'string') {
            return r.toLowerCase() === rangeInput.toLowerCase();
          }
          // If r is an object with a name property, use that
          if (r && typeof r === 'object' && 'name' in r && typeof r.name === 'string') {
            return r.name.toLowerCase() === rangeInput.toLowerCase();
          }
          // If r is not a string or object with name, compare directly
          return r === rangeInput;
        });
      }
    });

    // Category-Range relationship validation
    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: 'critical',
      message: 'Range must be valid for the selected Category',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Category) return false;
        
        const category = record.Category.toString().trim();
        const range = value.toString().trim();
        
        // If we have category-to-ranges mapping, use it
        if (masterData?.categoryToRanges) {
          // Handle self-referential mappings (e.g., "Sun" - "Sun", "Acne" - "Acne")
          if (category.toLowerCase() === range.toLowerCase()) {
            // Check if the category exists in master data
            return masterData.categories?.some(c => 
              typeof c === 'string' && c.toLowerCase() === category.toLowerCase()
            ) || false;
          }
          
          // Find the category in a case-insensitive way
          const categoryKey = Object.keys(masterData.categoryToRanges).find(
            key => key.toLowerCase() === category.toLowerCase()
          );
          
          // Get valid ranges for this category
          const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
          
          // Simplified validation - only check if range is valid for category
          // This is more performant than bidirectional validation
          return validRanges.some((m: string) => 
            m.toLowerCase() === range.toLowerCase()
          );
        }
        
        // If no mapping available, we can't validate this relationship
        return true;
      }
    });
    
    // Campaign-Range relationship validation
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'critical',
      message: 'Campaign does not match the specified Range',
      validate: (value, record, allRecords, masterData) => {
        // Skip validation if either campaign or range is missing
        if (!value || !record.Range) return true;
        
        const campaignInput = value.toString().trim();
        const rangeInput = record.Range.toString().trim();
        
        // Get the mappings from master data
        const campaignToRangeMap = masterData?.campaignToRangeMap || {};
        const rangeToCampaignsMap = masterData?.rangeToCampaignsMap || {};
        
        // If we don't have any mapping data, skip validation
        if (Object.keys(campaignToRangeMap).length === 0) {
          return true;
        }
        
        // Find the campaign in our mappings (case-insensitive)
        const campaignKey = Object.keys(campaignToRangeMap).find(
          key => key.toLowerCase() === campaignInput.toLowerCase()
        );
        
        // If we found the campaign in our mappings
        if (campaignKey) {
          const mappedRange = campaignToRangeMap[campaignKey];
          // Check if the specified range matches what's in our mapping
          return mappedRange.toLowerCase() === rangeInput.toLowerCase();
        }
        
        // If campaign isn't in our mappings, check if the range exists
        const rangeKey = Object.keys(rangeToCampaignsMap).find(
          key => key.toLowerCase() === rangeInput.toLowerCase()
        );
        
        // If the range exists in our mappings
        if (rangeKey) {
          // Check if the campaign is in the list of campaigns for this range
          const campaigns = rangeToCampaignsMap[rangeKey];
          return campaigns.some((c: string) => c.toLowerCase() === campaignInput.toLowerCase());
        }
        
        // If neither the campaign nor the range is in our mappings, we can't validate
        // So we'll assume it's valid to avoid false positives
        return true;
      }
    });

    // Budget validation
    this.rules.push({
      field: 'Budget',
      type: 'format',
      severity: 'critical',
      message: 'Budget must be a valid number greater than zero',
      validate: (value) => {
        if (!value) return false;
        
        // Try to parse the budget value
        const budget = this.parseNumber(value);
        
        // Normal validation logic
        const isValid = budget !== null && budget > 0;
        return isValid;
      }
    });
    
    // Budget equals sum of quarterly budgets validation
    this.rules.push({
      field: 'Budget',
      type: 'consistency',
      severity: 'critical',
      message: 'Budget should equal the sum of Q1, Q2, Q3, and Q4',
      validate: (value, record) => {
        if (!value) return true; // Skip if no budget
        
        // Parse the budget
        const budget = this.parseNumber(value);
        if (budget === null) return true; // Skip if invalid budget
        
        // Parse quarterly budgets
        const q1 = this.parseNumber(record['Q1 Budget'] || 0) || 0;
        const q2 = this.parseNumber(record['Q2 Budget'] || 0) || 0;
        const q3 = this.parseNumber(record['Q3 Budget'] || 0) || 0;
        const q4 = this.parseNumber(record['Q4 Budget'] || 0) || 0;
        
        // Calculate sum
        const sum = q1 + q2 + q3 + q4;
        
        // Special case: If only one quarterly budget is provided and it equals the total budget,
        // consider it valid (common pattern in media planning)
        const nonZeroQuarters = [q1, q2, q3, q4].filter(q => q > 0).length;
        const singleQuarterMatchesTotal = nonZeroQuarters === 1 && [
          Math.abs(q1 - budget) < 0.01,
          Math.abs(q2 - budget) < 0.01,
          Math.abs(q3 - budget) < 0.01,
          Math.abs(q4 - budget) < 0.01
        ].some(match => match);
        
        if (singleQuarterMatchesTotal) {
          return true;
        }
        
        // Check if sum equals budget (with small tolerance for floating point errors)
        const tolerance = 0.01; // 1 cent tolerance
        const isEqual = Math.abs(sum - budget) < tolerance;
        
        console.log('Budget validation:', {
          budget,
          q1, q2, q3, q4,
          sum,
          nonZeroQuarters,
          singleQuarterMatchesTotal,
          isEqual
        });
        
        return isEqual;
      }
    });

    // Media validation
    this.rules.push({
      field: 'Media',
      type: 'relationship',
      severity: 'critical',
      message: 'Media must be a valid media type from the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if media exists in master data
        const mediaInput = value.toString().trim();
        
        // Define allowed media types based on our database structure
        // These should match exactly with the media_types table
        const allowedMediaTypes = ['Digital', 'Traditional'];
        
        // Get media types from master data or use allowed types
        let mediaTypes = masterData?.mediaTypes || allowedMediaTypes;
        
        // Debug: Log media validation attempt
        console.log('Validating media value:', mediaInput);
        console.log('Available media types:', mediaTypes);
        
        // Case-insensitive search with type checking
        const isValid = mediaTypes.some((m: string | { name: string } | unknown) => {
          // Ensure m is a string before calling toLowerCase
          if (typeof m === 'string') {
            return m.toLowerCase() === mediaInput.toLowerCase();
          }
          // If m is an object with a name property, use that
          if (m && typeof m === 'object' && 'name' in m && typeof (m as { name: string }).name === 'string') {
            return (m as { name: string }).name.toLowerCase() === mediaInput.toLowerCase();
          }
          // If m is not a string or object with name, compare directly
          return m === mediaInput;
        });
        
        console.log(`Media validation result for ${mediaInput}: ${isValid}`);
        return isValid;
      }
    });

    // Media Subtype validation
    this.rules.push({
      field: 'Media Subtype',
      type: 'relationship',
      severity: 'critical',
      message: 'Media Subtype must be valid for the selected Media',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Media) return false; // Critical - require both fields
        
        const media = record.Media.toString().trim();
        const subtype = value.toString().trim();
        
        // Log validation attempt for debugging
        console.log(`Validating Media Subtype: "${subtype}" for Media: "${media}"`);
        
        // Standard validation for media types
        if (masterData?.mediaToSubtypes) {
          // Find the media type in a case-insensitive way
          const mediaKey = Object.keys(masterData.mediaToSubtypes).find(
            key => key.toLowerCase() === media.toLowerCase()
          );
          
          // Get valid subtypes for this media
          const validSubtypes = mediaKey ? masterData.mediaToSubtypes[mediaKey] || [] : [];
          
          console.log(`Valid subtypes for ${media}:`, validSubtypes);
          
          // If we have valid subtypes for this media type, validate against them
          if (validSubtypes.length > 0) {
            // Case-insensitive search with type checking
            const isValid = validSubtypes.some((s: string | { name: string }) => {
              // Ensure s is a string before calling toLowerCase
              if (typeof s === 'string') {
                return s.toLowerCase() === subtype.toLowerCase();
              }
              // If s is an object with a name property, use that
              if (s && typeof s === 'object' && 'name' in s && typeof s.name === 'string') {
                return s.name.toLowerCase() === subtype.toLowerCase();
              }
              // If s is not a string or object with name, compare directly
              return s === subtype;
            });
            
            console.log(`Validation result for ${subtype}: ${isValid}`);
            return isValid;
          } else {
            // If we don't have subtypes for this media type in our mapping,
            // but the media type itself is valid, we'll accept any subtype
            // This prevents false positives when the database doesn't have complete mappings
            console.log(`No subtypes found for media type ${media}, accepting any subtype`);
            return true;
          }
        }
        
        // If no mapping available, we can't validate this relationship
        // But we'll accept it to avoid false positives
        console.log('No media-to-subtypes mapping available, accepting any subtype');
        return true;
      }
    });

    // Date range validation
    this.rules.push({
      field: 'End Date',
      type: 'relationship',
      severity: 'warning',
      message: 'End Date should be after Start Date',
      validate: (value, record) => {
        if (!value || !record['Start Date']) return true; // Not critical
        
        const startDate = this.parseDate(record['Start Date']);
        const endDate = this.parseDate(value);
        
        if (!startDate || !endDate) return true; // Can't validate
        
        return endDate >= startDate;
      }
    });
  }
  
  // Helper method to check if a record is completely empty
  private isRecordEmpty(record: MediaSufficiencyRecord): boolean {
    // Check if all fields are empty, null, undefined, or just whitespace
    return Object.values(record).every(value => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      return false;
    });
  }

  // Validate a single record
  public validateRecord(record: MediaSufficiencyRecord, index: number, allRecords: MediaSufficiencyRecord[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Skip validation for completely empty rows
    if (this.isRecordEmpty(record)) {
      return [];
    }
    
    // Apply each validation rule
    for (const rule of this.rules) {
      // Skip if field doesn't exist in record
      if (!(rule.field in record)) continue;
      
      const value = record[rule.field];
      
      try {
        // For now, we'll handle async validation as synchronous
        // This is because the current architecture expects synchronous validation
        // In the future, this should be refactored to fully support async validation
        
        // Add special debug for Budget field and problematic fields
        if (rule.field === 'Budget' || rule.field === 'Range' || 
            (record.Category && ['Sun', 'Anti Age', 'Anti Pigment', 'Dry Skin'].includes(record.Category.toString()))) {
          console.log(`Validating ${rule.field} field:`, value);
          console.log(`Record Category: ${record.Category}, Range: ${record.Range}`);
          console.log(`Rule:`, { field: rule.field, type: rule.type, severity: rule.severity, message: rule.message });
        }
        
        const validationResult = rule.validate(value, record, allRecords, this.masterData);
        
        // If it's a Promise (async validation), we'll log a warning and treat it as valid
        // This is a temporary solution until we can fully refactor for async support
        if (validationResult instanceof Promise) {
          console.warn(`Async validation detected for ${rule.field} but not supported in current architecture. Treating as valid.`);
          continue;
        }
        
        const isValid = validationResult;
        
        // Only log critical validation failures in production
        if (!isValid && rule.severity === 'critical' && process.env.NODE_ENV === 'development') {
          console.log(`Critical validation failure: ${rule.field} at row ${index+1}`);
        }
        
        if (!isValid) {
          const issue: ValidationIssue = {
            rowIndex: index,
            columnName: rule.field,
            severity: rule.severity,
            message: rule.message,
            currentValue: value // Store the current value for comparison
          };
          
          // Minimal logging in production
          
          issues.push(issue);
        }
      } catch (error: any) {
        console.error(`Error validating ${rule.field} at row ${index + 1}:`, error);
        // Add a validation issue for the error
        issues.push({
          rowIndex: index,
          columnName: rule.field,
          severity: 'critical',
          message: `Validation error: ${error.message || 'Unknown error'}`,
          currentValue: value
        });
      }
    }
    
    return issues;
  }
  
  // Validate all records with support for chunked processing
  public async validateAll(records: MediaSufficiencyRecord[], rowOffset: number = 0): Promise<ValidationIssue[]> {
    // Minimal logging in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`Validating ${records.length} records with offset ${rowOffset}...`);
    }
    
    let allIssues: ValidationIssue[] = [];
    
    // Process records in smaller batches to prevent UI freezing
    // Increase batch size for better performance
    const MICRO_BATCH_SIZE = 250; // Process 250 records at a time within each chunk
    
    for (let i = 0; i < records.length; i += MICRO_BATCH_SIZE) {
      const batchEnd = Math.min(i + MICRO_BATCH_SIZE, records.length);
      const batch = records.slice(i, batchEnd);
      
      // Process each record in the micro-batch
      const batchIssues = await Promise.all(
        batch.map((record, j) => {
          const actualIndex = rowOffset + i + j; // Calculate the true row index with offset
          return this.validateRecord(record, actualIndex, records);
        })
      );
      
      // Flatten the array of arrays into a single array of issues
      allIssues = [...allIssues, ...batchIssues.flat()];
      
      // Yield to the main thread after each micro-batch to keep UI responsive
      // Use a shorter timeout to improve responsiveness
      if (i + MICRO_BATCH_SIZE < records.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return allIssues;
  }
  
  // Get a summary of validation issues
  public getValidationSummary(issues: ValidationIssue[]) {
    if (!Array.isArray(issues)) {
      console.error('getValidationSummary called with non-array:', issues);
      issues = [];
    }
    
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const suggestionCount = issues.filter(i => i.severity === 'suggestion').length;
    
    // Group issues by field
    const byField: { [key: string]: ValidationIssue[] } = {};
    issues.forEach(issue => {
      if (!byField[issue.columnName]) {
        byField[issue.columnName] = [];
      }
      byField[issue.columnName].push(issue);
    });
    
    // Count unique rows with issues
    const uniqueRows = new Set(issues.map(i => i.rowIndex)).size;
    
    return {
      total: issues.length,
      critical: criticalCount,
      warning: warningCount,
      suggestion: suggestionCount,
      byField,
      uniqueRows
    };
  }
  
  // Check if data can be imported (no critical issues)
  public canImport(issues: ValidationIssue[]): boolean {
    if (!Array.isArray(issues)) {
      console.error('canImport called with non-array:', issues);
      return false;
    }
    
    // Data can be imported if there are no critical issues
    return !issues.some(issue => issue.severity === 'critical');
  }
}

// Add default export for backward compatibility
export default MediaSufficiencyValidator;
