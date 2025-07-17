// Define validation issue interface
export interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
  suggestedValue?: any;
}

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
  TRPs?: string | number;
  'Reach 1+'?: string | number; // Percentage
  'Reach 3+'?: string | number; // Percentage  
  'Total WOA'?: string | number;
  'Weeks Off Air'?: string | number;
  'Playbook ID'?: string;
  'Objectives Values'?: string;
  // NEW FIELDS - Excel template fields
  'TV Demo Gender'?: string;
  'TV Demo Min. Age'?: number;
  'TV Demo Max. Age'?: number;
  'TV SEL'?: string;
  'Final TV Target (don\'t fill)'?: string;
  'TV Target Size'?: string;
  'TV Copy Length'?: string;
  'Total TV Planned R1+ (%)'?: string | number;
  'Total TV Planned R3+ (%)'?: string | number;
  'TV Potential R1+'?: string | number;
  'CPP 2024'?: number;
  'CPP 2025'?: number;
  'CPP 2026'?: number;
  'Reported Currency'?: string;
  'Is Digital target the same than TV?'?: boolean | string;
  'Digital Demo Gender'?: string;
  'Digital Demo Min. Age'?: number;
  'Digital Demo Max. Age'?: number;
  'Digital SEL'?: string;
  'Final Digital Target (don\'t fill)'?: string;
  'Digital Target Size (Abs)'?: string;
  'Total Digital Planned R1+'?: string | number;
  'Total Digital Potential R1+'?: string | number;
  'Planned Combined Reach (don\'t fill)'?: string;
  'Combined Potential Reach'?: string | number;
}

// Define validation rule types
export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'relationship' | 'uniqueness' | 'range' | 'consistency' | 'requirement';
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  validate: (value: any, record: MediaSufficiencyRecord, allRecords: MediaSufficiencyRecord[], masterData?: MasterData) => boolean | Promise<boolean | { isValid: boolean; message?: string }> | { isValid: boolean; message?: string };
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
      'Year', 'Sub Region', 'Country', 'Category', 'Range', 'Campaign', 'Media Type', 'Media Subtype', 
      'Start Date', 'End Date', 'Total Budget', 'Q1 Budget', 'Q2 Budget', 'Q3 Budget', 'Q4 Budget',
      'PM Type', 'Objectives Values',
      // NEW FIELDS - Excel template fields
      'TV Demo Gender', 'TV Demo Min. Age', 'TV Demo Max. Age', 'TV SEL', 'Final TV Target (don\'t fill)',
      'TV Target Size', 'TV Copy Length', 'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 
      'TV Potential R1+', 'CPP 2024', 'CPP 2025', 'CPP 2026', 'Reported Currency',
      'Is Digital target the same than TV?', 'Digital Demo Gender', 'Digital Demo Min. Age', 
      'Digital Demo Max. Age', 'Digital SEL', 'Final Digital Target (don\'t fill)', 
      'Digital Target Size (Abs)', 'Total Digital Planned R1+', 'Total Digital Potential R1+',
      'Planned Combined Reach (don\'t fill)', 'Combined Potential Reach'
    ];
    
    // Fields that are required (critical if missing)
    const requiredFields = [
      'Year', 'Country', 'Category', 'Range', 'Campaign', 'Media Type', 'Media Subtype', 
      'Start Date', 'End Date', 'Total Budget', 'Burst'
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

    // Year field consistency validation against financial cycle
    this.rules.push({
      field: 'Year',
      type: 'consistency',
      severity: 'critical',
      message: 'Year field must match the year in Start Date and End Date',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return true; // Skip if Year is missing (will be caught by required validation)
        
        // Extract year from the Year field value
        const yearValue = value.toString().trim();
        let yearFieldYear: number;
        
        // Handle different year formats in the Year field
        if (yearValue.includes(' ')) {
          // Format like "ABP 2025" - extract the year
          const yearMatch = yearValue.match(/\b(\d{4})\b/);
          if (!yearMatch) return true; // Can't extract year
          yearFieldYear = parseInt(yearMatch[1]);
        } else {
          // Direct year format like "2025"
          yearFieldYear = parseInt(yearValue);
          if (isNaN(yearFieldYear)) return true; // Invalid year format
        }
        
        // Validate Year field against dates in the same record only
        // This avoids false positives when there are mixed datasets
        if (record['Start Date'] || record['End Date']) {
          const startDate = record['Start Date'] ? this.parseDate(record['Start Date']) : null;
          const endDate = record['End Date'] ? this.parseDate(record['End Date']) : null;
          
          if (startDate) {
            const startYear = startDate.getFullYear();
            if (yearFieldYear !== startYear) {
              console.log(`Year field validation failed against Start Date:`, {
                yearFieldYear,
                startYear,
                yearValue,
                startDate: record['Start Date']
              });
              return false;
            }
          }
          
          if (endDate) {
            const endYear = endDate.getFullYear();
            if (yearFieldYear !== endYear) {
              console.log(`Year field validation failed against End Date:`, {
                yearFieldYear,
                endYear,
                yearValue,
                endDate: record['End Date']
              });
              return false;
            }
          }
        }
        
        return true; // If we can't determine inconsistency, assume it's valid
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

    // Financial cycle year validation for dates
    const dateFields2 = ['Start Date', 'End Date'];
    dateFields2.forEach(field => {
      this.rules.push({
        field,
        type: 'consistency',
        severity: 'critical',
        message: `${field} year must match the financial cycle year`,
        validate: (value, record) => {
          if (!value || !record.Year) return true; // Skip if either is missing
          
          // Parse the date
          const date = this.parseDate(value);
          if (!date) return true; // Skip if date is invalid (will be caught by format validation)
          
          // Get the year from the date
          const dateYear = date.getFullYear();
          
          // Get the financial cycle year
          const yearValue = record.Year.toString().trim();
          let financialCycleYear: number;
          
          // Handle different year formats
          if (yearValue.includes(' ')) {
            // Format like "ABP 2025" - extract the year
            const yearMatch = yearValue.match(/\b(\d{4})\b/);
            if (!yearMatch) return true; // Can't extract year
            financialCycleYear = parseInt(yearMatch[1]);
          } else {
            // Direct year format like "2025"
            financialCycleYear = parseInt(yearValue);
            if (isNaN(financialCycleYear)) return true; // Invalid year format
          }
          
          // Check if date year matches financial cycle year
          const isValid = dateYear === financialCycleYear;
          
          // Log for debugging when validation fails
          if (!isValid) {
            console.log(`Financial cycle year validation failed for ${field}:`, {
              dateYear,
              financialCycleYear,
              yearValue,
              dateValue: value
            });
          }
          
          return isValid;
        }
      });
    });

    // Sub Region validation - Combined existence and country match check
    this.rules.push({
      field: 'Sub Region',
      type: 'relationship',
      severity: 'critical', // Changed to critical as mismatch is more important than existence
      message: 'Sub Region must exist and match the selected country',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return true; // Sub Region is not required
        
        const subRegionInput = value.toString().trim();
        const countryInput = record['Country']?.toString().trim();
        const selectedCountry = masterData?.selectedCountry;
        
        // First check if sub-region exists
        const subRegions = masterData?.subRegions || [];
        const isValidSubRegion = subRegions.some((sr: string) => {
          return sr.toLowerCase() === subRegionInput.toLowerCase();
        });
        
        if (!isValidSubRegion) {
          // Check if it's a valid country name (sometimes countries are used as sub-regions)
          const countries = masterData?.countries || [];
          const isValidCountry = countries.some((country: string) => 
            country.toLowerCase() === subRegionInput.toLowerCase()
          );
          
          if (!isValidCountry) {
            return {
              isValid: false,
              message: `Sub-region '${subRegionInput}' not found in database`
            };
          }
        }
        
        // Now check country relationship
        const countryToCheck = countryInput || selectedCountry;
        
        if (!countryToCheck) {
          return true; // Can't validate relationship without country
        }
        
        // Find the country in master data
        const countriesData = masterData?.countries || [];
        const countryData = countriesData.find((c: any) => {
          if (typeof c === 'string') {
            return c.toLowerCase() === countryToCheck.toLowerCase();
          } else if (c && typeof c === 'object' && c.name) {
            return c.name.toLowerCase() === countryToCheck.toLowerCase();
          }
          return false;
        });
        
        if (!countryData) {
          return true; // Country not found, will be caught by country validation
        }
        
        // Get expected sub-region for this country
        const expectedSubRegion = typeof countryData === 'object' ? countryData.subRegion : null;
        
        if (expectedSubRegion) {
          // Check if the provided sub-region matches the expected one
          const isMatch = subRegionInput.toLowerCase() === expectedSubRegion.toLowerCase();
          
          if (!isMatch) {
            console.log(`[CRITICAL] Sub-region mismatch detected: '${subRegionInput}' != '${expectedSubRegion}' for country '${countryToCheck}'`);
            return {
              isValid: false,
              message: `Sub-region '${subRegionInput}' does not belong to country '${countryToCheck}'. Expected: '${expectedSubRegion}'`
            };
          }
        }
        
        return true;
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
        
        // Debug logging for country validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Validating country: "${countryInput}"`);
          console.log(`Available countries: ${countries.length}`, countries.slice(0, 5));
        }
        
        // Case-insensitive search - countries array now contains strings directly
        const isValid = countries.some((country: string) => {
          return country.toLowerCase() === countryInput.toLowerCase();
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Country "${countryInput}" validation result: ${isValid}`);
        }
        
        return isValid;
      }
    });
    
    // Selected Country validation - ensure country matches what was selected in dropdown
    this.rules.push({
      field: 'Country',
      type: 'consistency',
      severity: 'critical',
      message: 'Country does not match the selected country for this upload',
      validate: (value, record, allRecords, masterData) => {
        // Skip if no selected country is specified
        if (!masterData?.selectedCountry) return true;
        
        if (!value) return false;
        
        const countryInput = value.toString().trim();
        const selectedCountry = masterData.selectedCountry.toString().trim();
        
        // Case-insensitive comparison
        const matches = countryInput.toLowerCase() === selectedCountry.toLowerCase();
        
        if (!matches) {
          console.log(`Country mismatch: Expected "${selectedCountry}" but found "${countryInput}"`);
        }
        
        return matches;
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
        if (Object.keys(countryToSubRegionMap).length === 0 && Object.keys(subRegionToCountriesMap).length === 0) {
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
          const isMatch = mappedSubRegion.toLowerCase() === subRegionInput.toLowerCase();
          
          if (!isMatch) {
            console.log(`[CRITICAL] Country-SubRegion mismatch: '${subRegionInput}' != '${mappedSubRegion}' for country '${countryInput}'`);
            return {
              isValid: false,
              message: `Sub-region '${subRegionInput}' does not belong to country '${countryInput}'. Expected: '${mappedSubRegion}'`
            };
          }
          
          return true;
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
        // So we'll assume it's valid to avoid false positives but reduce severity to warning
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
        
        // Case-insensitive search - categories array now contains strings directly
        return categories.some((category: string) => {
          return category.toLowerCase() === categoryInput.toLowerCase();
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
        
        // Case-insensitive search - ranges array now contains strings directly
        return ranges.some((range: string) => {
          return range.toLowerCase() === rangeInput.toLowerCase();
        });
      }
    });

    // Campaign validation
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'critical',
      message: 'Campaign must be a valid campaign name',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if campaign exists in master data
        const campaignInput = value.toString().trim();
        const campaigns = masterData?.campaigns || [];
        
        // Case-insensitive search - handle both string and object formats
        return campaigns.some((campaign: string | { name: string }) => {
          const campaignName = typeof campaign === 'string' ? campaign : campaign.name;
          return campaignName.toLowerCase() === campaignInput.toLowerCase();
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
          // Find the category in a case-insensitive way
          const categoryKey = Object.keys(masterData.categoryToRanges).find(
            key => key.toLowerCase() === category.toLowerCase()
          );
          
          // Get valid ranges for this category
          const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
          
          // Check if range is valid for category (works for both self-referential and normal cases)
          return validRanges.some((m: string) => 
            m.toLowerCase() === range.toLowerCase()
          );
        }
        
        // If no mapping available, we can't validate this relationship
        return true;
      }
    });
    
    // Campaign-Range relationship validation with compatibility support
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
        const campaignCompatibilityMap = masterData?.campaignCompatibilityMap || {};
        
        // If we don't have any mapping data, skip validation
        if (Object.keys(campaignToRangeMap).length === 0) {
          return true;
        }
        
        // Find the campaign in our mappings (case-insensitive)
        const campaignKey = Object.keys(campaignToRangeMap).find(
          key => key.toLowerCase() === campaignInput.toLowerCase()
        );
        
        // Check primary mapping first
        if (campaignKey) {
          const mappedRange = campaignToRangeMap[campaignKey];
          // Check if the specified range matches the primary mapping
          if (mappedRange.toLowerCase() === rangeInput.toLowerCase()) {
            return true;
          }
        }
        
        // Check campaign compatibility mapping for multi-range support
        const compatibleCampaignKey = Object.keys(campaignCompatibilityMap).find(
          key => key.toLowerCase() === campaignInput.toLowerCase()
        );
        
        if (compatibleCampaignKey) {
          const compatibleRanges = campaignCompatibilityMap[compatibleCampaignKey] || [];
          // Check if the specified range is in the compatible ranges (case-insensitive)
          const isCompatible = compatibleRanges.some((range: string) => 
            range.toLowerCase() === rangeInput.toLowerCase()
          );
          if (isCompatible) {
            return true;
          }
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
      field: 'Total Budget',
      type: 'format',
      severity: 'critical',
      message: 'Total Budget must be a valid number greater than zero',
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
      field: 'Total Budget',
      type: 'consistency',
      severity: 'critical',
      message: 'Total Budget should equal the sum of Q1, Q2, Q3, and Q4 budgets',
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

    // Media Type validation
    this.rules.push({
      field: 'Media Type',
      type: 'relationship',
      severity: 'critical',
      message: 'Media Type must be a valid media type from the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if media exists in master data
        const mediaInput = value.toString().trim();
        
        // Define allowed media types based on our database structure
        // These should match exactly with the media_types table
        const allowedMediaTypes = ['Digital', 'Traditional'];
        
        // Get media types from master data or use allowed types
        let mediaTypes = masterData?.mediaTypes || allowedMediaTypes;
        
        // Debug logging for media validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Validating media: "${mediaInput}"`);
          console.log(`Available media types: ${mediaTypes.length}`, mediaTypes);
        }
        
        // Case-insensitive search - mediaTypes array now contains strings directly
        const isValid = mediaTypes.some((mediaType: string) => {
          return mediaType.toLowerCase() === mediaInput.toLowerCase();
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Media "${mediaInput}" validation result: ${isValid}`);
        }
        
        return isValid;
      }
    });

    // Media Type validation (alternative field name)
    this.rules.push({
      field: 'Media Type',
      type: 'relationship',
      severity: 'critical',
      message: 'Media Type must be a valid media type from the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if media exists in master data
        const mediaInput = value.toString().trim();
        
        // Define allowed media types based on our database structure
        // These should match exactly with the media_types table
        const allowedMediaTypes = ['Digital', 'Traditional'];
        
        // Get media types from master data or use allowed types
        let mediaTypes = masterData?.mediaTypes || allowedMediaTypes;
        
        // Debug logging for media validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Validating Media Type: "${mediaInput}"`);
          console.log(`Available media types: ${mediaTypes.length}`, mediaTypes);
        }
        
        // Case-insensitive search - mediaTypes array now contains strings directly
        const isValid = mediaTypes.some((mediaType: string) => {
          return mediaType.toLowerCase() === mediaInput.toLowerCase();
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Media Type "${mediaInput}" validation result: ${isValid}`);
        }
        
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
        // Check for both 'Media' and 'Media Type' field names
        const mediaField = record.Media || record['Media Type'];
        if (!value || !mediaField) return false; // Critical - require both fields
        
        const media = mediaField.toString().trim();
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
            // Case-insensitive search - handle both string and object formats
            const isValid = validSubtypes.some((subType: string | { name: string }) => {
              const subTypeName = typeof subType === 'string' ? subType : subType.name;
              return subTypeName.toLowerCase() === subtype.toLowerCase();
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

    // PM Type validation
    this.rules.push({
      field: 'PM Type',
      type: 'relationship',
      severity: 'warning',
      message: 'PM Type must be a valid type from the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return true; // PM Type is optional
        
        // Check if PM Type exists in master data
        const pmTypeInput = value.toString().trim();
        const pmTypes = masterData?.pmTypes || [];
        
        // Debug logging for PM Type validation
        if (process.env.NODE_ENV === 'development') {
          console.log(`Validating PM Type: "${pmTypeInput}"`);
          console.log(`Available PM Types: ${pmTypes.length}`, pmTypes);
        }
        
        // Case-insensitive search - pmTypes array contains strings directly
        const isValid = pmTypes.some((pmType: string) => {
          return pmType.toLowerCase() === pmTypeInput.toLowerCase();
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`PM Type "${pmTypeInput}" validation result: ${isValid}`);
        }
        
        return isValid;
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

    // Campaign uniqueness validation within the same country
    this.rules.push({
      field: 'Campaign',
      type: 'uniqueness',
      severity: 'critical',
      message: 'Duplicate campaign found: same Campaign, Country, Category, Range, Media, Media SubType, and dates combination already exists',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return true; // Skip if Campaign is missing
        
        const currentRecord = {
          campaign: value.toString().trim(),
          country: record.Country ? record.Country.toString().trim() : '',
          category: record.Category ? record.Category.toString().trim() : '',
          range: record.Range ? record.Range.toString().trim() : '',
          media: record.Media ? record.Media.toString().trim() : '',
          mediaSubType: record['Media Subtype'] ? record['Media Subtype'].toString().trim() : '',
          pmType: record['PM Type'] ? record['PM Type'].toString().trim() : '',
          businessUnit: record['Business Unit'] ? record['Business Unit'].toString().trim() : '',
          startDate: record['Start Date'] ? this.formatDate(this.parseDate(record['Start Date'])) : '',
          endDate: record['End Date'] ? this.formatDate(this.parseDate(record['End Date'])) : ''
        };
        
        // Count how many records have the same key combination
        let duplicateCount = 0;
        const duplicateIndices: number[] = [];
        
        allRecords.forEach((otherRecord, index) => {
          // Skip empty records
          if (this.isRecordEmpty(otherRecord)) return;
          
          const otherRecordData = {
            campaign: otherRecord.Campaign ? otherRecord.Campaign.toString().trim() : '',
            country: otherRecord.Country ? otherRecord.Country.toString().trim() : '',
            category: otherRecord.Category ? otherRecord.Category.toString().trim() : '',
            range: otherRecord.Range ? otherRecord.Range.toString().trim() : '',
            media: otherRecord.Media ? otherRecord.Media.toString().trim() : '',
            mediaSubType: otherRecord['Media Subtype'] ? otherRecord['Media Subtype'].toString().trim() : '',
            pmType: otherRecord['PM Type'] ? otherRecord['PM Type'].toString().trim() : '',
            businessUnit: otherRecord['Business Unit'] ? otherRecord['Business Unit'].toString().trim() : '',
            startDate: otherRecord['Start Date'] ? this.formatDate(this.parseDate(otherRecord['Start Date'])) : '',
            endDate: otherRecord['End Date'] ? this.formatDate(this.parseDate(otherRecord['End Date'])) : ''
          };
          
          // Check if this record matches our uniqueness criteria (case-insensitive)
          const isMatch = 
            currentRecord.campaign.toLowerCase() === otherRecordData.campaign.toLowerCase() &&
            currentRecord.country.toLowerCase() === otherRecordData.country.toLowerCase() &&
            currentRecord.category.toLowerCase() === otherRecordData.category.toLowerCase() &&
            currentRecord.range.toLowerCase() === otherRecordData.range.toLowerCase() &&
            currentRecord.media.toLowerCase() === otherRecordData.media.toLowerCase() &&
            currentRecord.mediaSubType.toLowerCase() === otherRecordData.mediaSubType.toLowerCase() &&
            currentRecord.pmType.toLowerCase() === otherRecordData.pmType.toLowerCase() &&
            currentRecord.businessUnit.toLowerCase() === otherRecordData.businessUnit.toLowerCase() &&
            currentRecord.startDate === otherRecordData.startDate &&
            currentRecord.endDate === otherRecordData.endDate;
          
          if (isMatch) {
            duplicateCount++;
            duplicateIndices.push(index);
          }
        });
        
        // If we found more than 1 match (including current record), it's a duplicate
        if (duplicateCount > 1) {
          console.log(`Duplicate campaign detected:`, {
            campaign: currentRecord.campaign,
            country: currentRecord.country,
            category: currentRecord.category,
            range: currentRecord.range,
            media: currentRecord.media,
            mediaSubType: currentRecord.mediaSubType,
            pmType: currentRecord.pmType,
            businessUnit: currentRecord.businessUnit,
            startDate: currentRecord.startDate,
            endDate: currentRecord.endDate,
            duplicateCount,
            duplicateIndices
          });
          return false;
        }
        
        return true;
      }
    });

    // Burst validation - must be positive integer
    this.rules.push({
      field: 'Burst',
      type: 'format',
      severity: 'critical',
      message: 'Burst must be a positive integer (1 or greater)',
      validate: (value, record, allRecords, masterData) => {
        if (!value || value.toString().trim() === '') {
          return false; // Required field, will be caught by required field validation
        }
        
        // Parse as integer
        const burstValue = parseInt(value.toString().trim(), 10);
        
        if (isNaN(burstValue) || burstValue < 1) {
          return {
            isValid: false,
            message: `Burst must be a positive integer (1 or greater). Current value: '${value}'`
          };
        }
        
        return true;
      }
    });

    // Total TRPs validation - only for TV media types
    this.rules.push({
      field: 'Total TRPs',
      type: 'relationship',
      severity: 'critical',
      message: 'Total TRPs should only be used for TV media types',
      validate: (value, record, allRecords, masterData) => {
        if (!value || value.toString().trim() === '') {
          return true; // Empty TRPs is fine
        }
        
        const mediaType = record['Media Type'] || record['Media']?.toString().trim();
        const mediaSubtype = record['Media Subtype'] || record['Media Sub Type']?.toString().trim();
        
        // Check if it's a TV media type
        const isTvMedia = mediaType?.toLowerCase().includes('traditional') ||
                         mediaType?.toLowerCase().includes('tv') ||
                         mediaSubtype?.toLowerCase().includes('tv') ||
                         mediaSubtype?.toLowerCase().includes('television') ||
                         mediaSubtype?.toLowerCase().includes('open') ||
                         mediaSubtype?.toLowerCase().includes('paid');
        
        if (!isTvMedia) {
          return {
            isValid: false,
            message: `Total TRPs should only be used for TV media types (Open TV, Paid TV, etc.). Media type '${mediaSubtype || mediaType}' does not support TRPs. Consider using reach metrics instead.`
          };
        }
        
        return true;
      }
    });

    // Media Subtype and PM Type combination validation (PM Type field)
    this.rules.push({
      field: 'PM Type',
      type: 'relationship',
      severity: 'critical',
      message: 'Invalid PM Type for the selected Media Subtype',
      validate: (value, record, allRecords, masterData) => {
        const pmType = value?.toString().trim();
        const mediaType = record['Media Type'] || record['Media']?.toString().trim();
        const mediaSubtype = record['Media Subtype'] || record['Media Sub Type']?.toString().trim();
        
        if (!pmType || !mediaSubtype) {
          return true; // Skip validation if either is missing
        }
        
        // Define valid combinations
        const validCombinations: Record<string, string[]> = {
          // Digital combinations
          'pm & ff': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'influencers amplification': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'influencers amp.': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'influencers organic': ['Non PM'],
          'influencers org.': ['Non PM'],
          'influencers': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'Non PM', 'PM & FF'],
          'other digital': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'Non PM', 'PM & FF'],
          'search': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'paid search': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          // Traditional combinations
          'open tv': ['Non PM', 'GR Only'],
          'paid tv': ['Non PM', 'GR Only'],
          'ooh': ['Non PM', 'GR Only'],
          'radio': ['Non PM', 'GR Only'],
          'others': ['Non PM', 'GR Only']
        };
        
        // Normalize the media subtype for comparison
        const normalizedSubtype = mediaSubtype.toLowerCase();
        
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
            allowed.toLowerCase() === pmType.toLowerCase()
          );
          
          if (!isValid) {
            return {
              isValid: false,
              message: `PM Type '${pmType}' is not valid for Media Subtype '${mediaSubtype}'. Allowed PM Types: ${allowedPmTypes.join(', ')}`
            };
          }
        }
        
        return true;
      }
    });

    // Media Subtype and PM Type combination validation (Media Subtype field)
    this.rules.push({
      field: 'Media Subtype',
      type: 'relationship',
      severity: 'critical',
      message: 'Invalid Media Subtype for the selected PM Type',
      validate: (value, record, allRecords, masterData) => {
        const mediaSubtype = value?.toString().trim();
        const pmType = record['PM Type']?.toString().trim();
        
        if (!pmType || !mediaSubtype) {
          return true; // Skip validation if either is missing
        }
        
        // Define valid combinations (reverse mapping)
        const validCombinations: Record<string, string[]> = {
          // Digital combinations
          'pm & ff': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'influencers amplification': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'influencers amp.': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'influencers organic': ['Non PM'],
          'influencers org.': ['Non PM'],
          'influencers': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'Non PM', 'PM & FF'],
          'other digital': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'Non PM', 'PM & FF'],
          'search': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          'paid search': ['GR Only', 'PM Advanced', 'Full Funnel Basic', 'Full Funnel Advanced', 'PM & FF'],
          // Traditional combinations
          'open tv': ['Non PM', 'GR Only'],
          'paid tv': ['Non PM', 'GR Only'],
          'ooh': ['Non PM', 'GR Only'],
          'radio': ['Non PM', 'GR Only'],
          'others': ['Non PM', 'GR Only']
        };
        
        // Normalize the media subtype for comparison
        const normalizedSubtype = mediaSubtype.toLowerCase();
        
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
            allowed.toLowerCase() === pmType.toLowerCase()
          );
          
          if (!isValid) {
            return {
              isValid: false,
              message: `Media Subtype '${mediaSubtype}' cannot be used with PM Type '${pmType}'. Allowed PM Types: ${allowedPmTypes.join(', ')}`
            };
          }
        }
        
        return true;
      }
    });

    // Country validation - check if country exists in database
    this.rules.push({
      field: 'Country',
      type: 'relationship',
      severity: 'critical',
      message: 'Country must exist in the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const countryName = value.toString().trim();
        const countries = masterData?.countries || [];
        // Countries are returned as array of strings, not objects
        return countries.some((country: string) => 
          country.toLowerCase() === countryName.toLowerCase()
        );
      }
    });

    // Category validation - check if category exists in database  
    this.rules.push({
      field: 'Category',
      type: 'relationship',
      severity: 'critical',
      message: 'Category must exist in the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const categoryName = value.toString().trim();
        const categories = masterData?.categories || [];
        // Categories are returned as array of strings, not objects
        return categories.some((category: string) => 
          category.toLowerCase() === categoryName.toLowerCase()
        );
      }
    });

    // Range validation - check if range exists and is linked to category
    this.rules.push({
      field: 'Range',
      type: 'relationship', 
      severity: 'critical',
      message: 'Range must exist in the database and be linked to the specified Category',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const rangeName = value.toString().trim();
        const categoryName = record['Category']?.toString().trim();
        
        // Check if range exists (ranges are returned as array of strings)
        const ranges = masterData?.ranges || [];
        const rangeExists = ranges.some((range: string) => 
          range.toLowerCase() === rangeName.toLowerCase()
        );
        
        if (!rangeExists) return false;
        
        // Check if range is linked to category
        const categoryToRanges = masterData?.categoryToRanges || {};
        const categoryRanges = categoryName ? (categoryToRanges[categoryName] || []) : [];
        return categoryRanges.some((range: string) => 
          range.toLowerCase() === rangeName.toLowerCase()
        );
      }
    });

    // Campaign validation - check if campaign exists
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'critical', 
      message: 'Campaign must exist in the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const campaignName = value.toString().trim();
        const campaigns = masterData?.campaigns || [];
        // Handle both string and object formats for campaigns
        return campaigns.some((campaign: string | { name: string }) => {
          const cName = typeof campaign === 'string' ? campaign : campaign.name;
          return cName.toLowerCase() === campaignName.toLowerCase();
        });
      }
    });

    // Media Subtype validation - check if it exists and is linked to Media Type
    this.rules.push({
      field: 'Media Subtype',
      type: 'relationship',
      severity: 'critical',
      message: 'Media Subtype must exist and be linked to the specified Media Type',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const subtypeName = value.toString().trim();
        // Check for both 'Media' and 'Media Type' field names
        const mediaTypeName = (record.Media || record['Media Type'])?.toString().trim();
        
        // Check if subtype exists (mediaSubTypes are returned as array of strings)
        const mediaSubTypes = masterData?.mediaSubTypes || [];
        const subtypeExists = mediaSubTypes.some((subtype: string) => 
          subtype.toLowerCase() === subtypeName.toLowerCase()
        );
        
        if (!subtypeExists) return false;
        
        // Check if subtype is linked to media type
        const mediaToSubtypes = masterData?.mediaToSubtypes || {};
        const mediaSubtypes = mediaTypeName ? (mediaToSubtypes[mediaTypeName] || []) : [];
        return mediaSubtypes.some((subtype: string | { name: string }) => {
          const subtypeNameFromArray = typeof subtype === 'string' ? subtype : subtype.name;
          return subtypeNameFromArray.toLowerCase() === subtypeName.toLowerCase();
        });
      }
    });

    // PM Type validation - check if it exists in database
    this.rules.push({
      field: 'PM Type',
      type: 'relationship',
      severity: 'warning', // Changed to warning since relationship mapping isn't available
      message: 'PM Type should exist in the database',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return true; // PM Type is optional
        const pmTypeName = value.toString().trim();
        
        // Check if PM Type exists (pmTypes are returned as array of strings)
        const pmTypes = masterData?.pmTypes || [];
        return pmTypes.some((pmType: string) => 
          pmType.toLowerCase() === pmTypeName.toLowerCase()
        );
        
        // Note: Subtype-to-PMType relationship validation is disabled 
        // until the master data API includes subtypeToPmTypes mapping
      }
    });

    // Total R1+ validation for digital, Open TV and OOH media types
    this.rules.push({
      field: 'Total R1+',
      type: 'requirement',
      severity: 'critical',
      message: 'Total R1+ is mandatory for Digital, Open TV and OOH media types',
      validate: (value, record, allRecords, masterData) => {
        // Check if this is a digital media type
        const mediaType = record['Media Type'] || record['Media']?.toString().trim();
        const mediaSubtype = record['Media Subtype'] || record['Media Sub Type']?.toString().trim();
        
        // Check if it's digital media
        const isDigital = mediaType?.toLowerCase().includes('digital') || 
                         mediaSubtype?.toLowerCase().includes('display') ||
                         mediaSubtype?.toLowerCase().includes('digital') ||
                         mediaSubtype?.toLowerCase().includes('video') ||
                         mediaSubtype?.toLowerCase().includes('social');
        
        // Check if it's Open TV or OOH
        const isOpenTv = mediaSubtype?.toLowerCase().includes('open') || 
                        (mediaSubtype?.toLowerCase().includes('tv') && mediaSubtype?.toLowerCase().includes('open'));
        
        const isOoh = mediaSubtype?.toLowerCase().includes('ooh') ||
                     mediaSubtype?.toLowerCase().includes('out of home') ||
                     mediaSubtype?.toLowerCase().includes('outdoor') ||
                     mediaType?.toLowerCase().includes('ooh');
        
        const requiresR1Plus = isDigital || isOpenTv || isOoh;
        
        if (requiresR1Plus) {
          // Total R1+ is required for these media types
          if (!value || value.toString().trim() === '') {
            let mediaTypeDesc = mediaSubtype || mediaType;
            let message: string;
            if (isDigital) {
              message = `Total R1+ is mandatory for digital media type '${mediaTypeDesc}'. Please provide a value.`;
            } else if (isOpenTv) {
              message = `Total R1+ is mandatory for Open TV media type '${mediaTypeDesc}'. Please provide a value.`;
            } else if (isOoh) {
              message = `Total R1+ is mandatory for OOH (Out of Home) media type '${mediaTypeDesc}'. Please provide a value.`;
            } else {
              message = `Total R1+ is mandatory for this media type. Please provide a value.`;
            }
            return {
              isValid: false,
              message
            };
          }
          
          // Validate it's a valid percentage
          const numValue = this.parseNumber(value);
          if (numValue === null || numValue < 0 || numValue > 100) {
            return {
              isValid: false,
              message: `Total R1+ value '${value}' is invalid. Must be between 0-100%.`
            };
          }
        }
        
        return true;
      }
    });

    // Campaign-Range relationship validation - check if existing campaign is linked to correct range
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'warning',
      message: 'Campaign exists but is linked to a different range than specified in your data',
      validate: async (value, record, allRecords, masterData) => {
        if (!value || !record['Range']) return true;
        
        const campaignName = value.toString().trim();
        const expectedRangeName = record['Range'].toString().trim();
        
        try {
          // Check if we have campaign data in masterData with range relationships
          const campaigns = masterData?.campaigns || [];
          
          // Find the campaign in master data (campaigns should include range information)
          const campaign = campaigns.find((c: any) => {
            // Handle both string and object formats
            const cName = typeof c === 'string' ? c : c.name;
            return cName && cName.toLowerCase() === campaignName.toLowerCase();
          });
          
          // If campaign exists in master data and has range info, validate relationship
          if (campaign && typeof campaign === 'object' && campaign.range) {
            const actualRangeName = campaign.range.name || campaign.range;
            if (actualRangeName && actualRangeName.toLowerCase() !== expectedRangeName.toLowerCase()) {
              // Return object with custom message
              return {
                isValid: false,
                message: `Campaign '${campaignName}' exists but is linked to range '${actualRangeName}', not '${expectedRangeName}' as specified in your data. This may indicate a data inconsistency that should be reviewed.`
              };
            }
          }
          
          return true;
        } catch (error) {
          // If we can't check, assume valid to avoid false positives
          console.warn('Failed to validate campaign-range relationship:', error);
          return true;
        }
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
  public async validateRecord(record: MediaSufficiencyRecord, index: number, allRecords: MediaSufficiencyRecord[]): Promise<ValidationIssue[]> {
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
        // Add special debug for Budget field and problematic fields
        if (rule.field === 'Budget' || rule.field === 'Range' || 
            (record.Category && ['Sun', 'Anti Age', 'Anti Pigment', 'Dry Skin'].includes(record.Category.toString()))) {
          console.log(`Validating ${rule.field} field:`, value);
          console.log(`Record Category: ${record.Category}, Range: ${record.Range}`);
          console.log(`Rule:`, { field: rule.field, type: rule.type, severity: rule.severity, message: rule.message });
        }
        
        const validationResult = rule.validate(value, record, allRecords, this.masterData);
        
        // Handle both sync and async validation
        let isValid: boolean;
        let customMessage: string | undefined;
        
        if (validationResult instanceof Promise) {
          // Properly await async validation
          const result = await validationResult;
          if (result && typeof result === 'object' && 'isValid' in result) {
            isValid = result.isValid;
            customMessage = result.message;
          } else {
            isValid = result as boolean;
          }
        } else {
          if (validationResult && typeof validationResult === 'object' && 'isValid' in validationResult) {
            isValid = validationResult.isValid;
            customMessage = validationResult.message;
          } else {
            isValid = validationResult as boolean;
          }
        }
        
        // Only log critical validation failures in production
        if (!isValid && rule.severity === 'critical' && process.env.NODE_ENV === 'development') {
          console.log(`Critical validation failure: ${rule.field} at row ${index+1}`);
        }
        
        if (!isValid) {
          const issue: ValidationIssue = {
            rowIndex: index,
            columnName: rule.field,
            severity: rule.severity,
            message: customMessage || rule.message,
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
