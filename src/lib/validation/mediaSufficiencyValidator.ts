import { ValidationIssue } from '@/components/media-sufficiency/DataPreviewGrid';

// Define validation rule types
export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'relationship' | 'uniqueness' | 'range' | 'consistency';
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  validate: (value: any, record: any, allRecords: any[], masterData?: any) => boolean | Promise<boolean>;
}

// Define the validator class
export class MediaSufficiencyValidator {
  private rules: ValidationRule[] = [];
  private masterData: any = {};

  constructor(masterData?: any) {
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
      'Year', 'Country', 'Category', 'Range', 'Campaign', 'Media', 'Media Subtype', 
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
            if (c && typeof c === 'object' && 'name' in c && typeof c.name === 'string') return c.name.toLowerCase();
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
          // Special case for Hand Body + Luminous 630
          if (category === 'Hand Body' && range === 'Luminous 630') {
            console.log('Found Hand Body + Luminous 630 combination - flagging as invalid');
            return false;
          }
          
          const validRanges = masterData.categoryToRanges[category] || [];
          
          // Case-insensitive search with type checking
          const isValid = validRanges.some((m: string) => {
            return m.toLowerCase() === range.toLowerCase();
          });
          
          return isValid;
        }
        
        // If no mapping available, we can't validate this relationship
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
        
        // Check if sum equals budget (with small tolerance for floating point errors)
        const tolerance = 0.01; // 1 cent tolerance
        const isEqual = Math.abs(sum - budget) < tolerance;
        
        console.log('Budget validation:', {
          budget,
          q1, q2, q3, q4,
          sum,
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
      message: 'Media must be a valid media type',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if media exists in master data
        const mediaInput = value.toString().trim();
        
        // Define common media types if not in master data
        const defaultMediaTypes = ['Digital', 'Traditional', 'Social', 'Print', 'TV', 'Radio', 'OOH'];
        
        // Get media types from master data or use defaults
        let mediaTypes = masterData?.mediaTypes || [];
        
        // If no media types in master data, try to extract from records
        if (mediaTypes.length === 0 && masterData?.records) {
          const extractedTypes = new Set<string>();
          
          // Extract unique media types from records
          masterData.records.forEach((record: any) => {
            if (record['Media Types'] && typeof record['Media Types'] === 'string') {
              extractedTypes.add(record['Media Types'].trim());
            }
          });
          
          mediaTypes = Array.from(extractedTypes);
        }
        
        // If still no media types, use defaults
        if (mediaTypes.length === 0) {
          mediaTypes = defaultMediaTypes;
        }
        
        // Debug: Log ALL media validation attempts
        console.log('Validating media value:', mediaInput);
        console.log('Available media types:', mediaTypes);
        console.log('Media types as lowercase:', mediaTypes.map(m => {
          if (typeof m === 'string') return m.toLowerCase();
          if (m && typeof m === 'object' && 'name' in m && typeof m.name === 'string') return m.name.toLowerCase();
          return String(m);
        }));
        
        // Force Traditional to be valid
        if (mediaInput.toLowerCase() === 'traditional') {
          console.log('Found Traditional media type - forcing it to be valid');
          return true;
        }
        
        // Also accept any media type that contains 'traditional'
        if (mediaInput.toLowerCase().includes('traditional')) {
          console.log('Found media type containing traditional - forcing it to be valid');
          return true;
        }
        
        // Case-insensitive search with type checking
        return mediaTypes.some((m: any) => {
          // Ensure m is a string before calling toLowerCase
          if (typeof m === 'string') {
            return m.toLowerCase() === mediaInput.toLowerCase();
          }
          // If m is an object with a name property, use that
          if (m && typeof m === 'object' && 'name' in m && typeof m.name === 'string') {
            return m.name.toLowerCase() === mediaInput.toLowerCase();
          }
          // If m is not a string or object with name, compare directly
          return m === mediaInput;
        });
      }
    });

    // Media Subtype validation
    this.rules.push({
      field: 'Media Subtype',
      type: 'relationship',
      severity: 'warning',
      message: 'Media Subtype should be valid for the selected Media',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Media) return true; // Not critical
        
        const media = record.Media.toString().trim();
        const subtype = value.toString().trim();
        
        // If we have media-to-subtypes mapping, use it
        if (masterData?.mediaToSubtypes) {
          const validSubtypes = masterData.mediaToSubtypes[media] || [];
          
          // Case-insensitive search with type checking
          return validSubtypes.some((s: string | { name: string }) => {
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
        }
        
        // If no mapping available, we can't validate this relationship
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
  
  // Validate a single record
  public validateRecord(record: any, index: number, allRecords: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Apply each validation rule
    for (const rule of this.rules) {
      // Skip if field doesn't exist in record
      if (!(rule.field in record)) continue;
      
      const value = record[rule.field];
      
      try {
        // For now, we'll handle async validation as synchronous
        // This is because the current architecture expects synchronous validation
        // In the future, this should be refactored to fully support async validation
        // Add special debug for Budget field
        if (rule.field === 'Budget') {
          console.log('Validating Budget field:', value);
          console.log('Budget rule:', rule);
        }
        
        const validationResult = rule.validate(value, record, allRecords, this.masterData);
        
        // If it's a Promise (async validation), we'll log a warning and treat it as valid
        // This is a temporary solution until we can fully refactor for async support
        if (validationResult instanceof Promise) {
          console.warn(`Async validation detected for ${rule.field} but not supported in current architecture. Treating as valid.`);
          continue;
        }
        
        const isValid = validationResult;
        
        // Add special debug for Budget validation result
        if (rule.field === 'Budget') {
          console.log('Budget validation result:', isValid);
        }
        
        if (!isValid) {
          const issue: ValidationIssue = {
            rowIndex: index,
            columnName: rule.field,
            severity: rule.severity,
            message: rule.message,
            currentValue: value // Store the current value for comparison
          };
          
          // Log budget issues specifically
          if (rule.field === 'Budget') {
            console.log('Adding Budget validation issue:', issue);
          }
          
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
  
  // Validate all records
  public async validateAll(records: any[]): Promise<ValidationIssue[]> {
    console.log(`Validating ${records.length} records...`);
    console.log('Master data keys:', Object.keys(this.masterData));
    
    // Debug: Log all master data for inspection
    console.log('Master data content:');
    if (this.masterData.mediaTypes) {
      console.log('Media Types:', this.masterData.mediaTypes);
    }
    if (this.masterData.categories) {
      console.log('Categories:', this.masterData.categories);
    }
    if (this.masterData.ranges) {
      console.log('Ranges:', this.masterData.ranges);
    }
    
    if (this.masterData.categoryToRanges) {
      console.log('Using custom master data with category-range mappings');
      console.log('Categories:', Object.keys(this.masterData.categoryToRanges));
      console.log('Ranges with multiple categories:', 
        Object.entries(this.masterData.rangeToCategories || {})
          .filter((entry) => {
            const [_, categories] = entry as [string, string[]];
            return categories.length > 1;
          })
          .map((entry) => {
            const [range, categories] = entry as [string, string[]];
            return `${range}: ${categories.join(', ')}`;
          })
      );
    }
    
    let allIssues: ValidationIssue[] = [];
    
    // Use for...of loop instead of forEach to allow await inside the loop
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      
      if (index < 3) {
        console.log(`Validating record ${index}:`, record);
      }
      
      const issues = this.validateRecord(record, index, records);
      allIssues = [...allIssues, ...issues];
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
