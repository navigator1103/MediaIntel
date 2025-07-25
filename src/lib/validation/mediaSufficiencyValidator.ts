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
  'Campaign Archetype'?: string;
  Media?: string;
  'Media Subtype'?: string;
  'Initial Date'?: string | Date;
  'End Date'?: string | Date;
  Budget?: string | number;
  Jan?: string | number;
  Feb?: string | number;
  Mar?: string | number;
  Apr?: string | number;
  May?: string | number;
  Jun?: string | number;
  Jul?: string | number;
  Aug?: string | number;
  Sep?: string | number;
  Oct?: string | number;
  Nov?: string | number;
  Dec?: string | number;
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
  type: 'required' | 'format' | 'relationship' | 'uniqueness' | 'range' | 'consistency' | 'requirement' | 'cross_reference';
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  validate: (value: any, record: MediaSufficiencyRecord, allRecords: MediaSufficiencyRecord[], masterData?: MasterData) => boolean | Promise<boolean | { isValid: boolean; message?: string }> | { isValid: boolean; message?: string };
}

// Define the validator class
export class MediaSufficiencyValidator {
  protected rules: ValidationRule[] = [];
  protected masterData: MasterData = {};
  protected autoCreateMode: boolean = false;
  protected abpYear: number | null = null;

  constructor(masterData?: MasterData, autoCreateMode: boolean = false, abpCycle?: string) {
    if (masterData) {
      this.masterData = masterData;
    }
    this.autoCreateMode = autoCreateMode;
    
    // Extract year from ABP cycle (e.g., "ABP 2025" -> 2025)
    if (abpCycle) {
      const yearMatch = abpCycle.match(/(\d{4})/);
      if (yearMatch) {
        this.abpYear = parseInt(yearMatch[1]);
        console.log('ABP Year extracted:', this.abpYear, 'from cycle:', abpCycle);
      }
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
    
    // Simple date parsing for common formats
    const dateStr = value.toString().trim();
    
    // Try ISO format first (YYYY-MM-DD)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try DD-Mon-YY format (like "01-Jan-25")
    const shortDateMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (shortDateMatch) {
      const [, day, monthStr, yearShort] = shortDateMatch;
      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const month = monthMap[monthStr];
      if (month !== undefined) {
        // Convert 2-digit year to 4-digit (assuming 20xx for years 00-99)
        const year = 2000 + parseInt(yearShort);
        const date = new Date(year, month, parseInt(day));
        if (!isNaN(date.getTime())) return date;
      }
    }
    
    // Try standard Date constructor as fallback
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    } catch (error) {
      // Date parsing failed
    }
    
    return null;
  }
  
  // Format dates using the shared utility
  private formatDate(date: Date | string | number | null): string {
    if (!date) return '';
    
    // Simple date formatting to YYYY-MM-DD
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // If it's a string or number, try to parse it first
    const parsedDate = this.parseDate(date);
    if (parsedDate) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return date.toString();
  }
  
  // Initialize default validation rules
  protected initializeRules() {
    // Define REQUIRED columns - all must be present in CSV (your exact list)
    const allExpectedColumns = [
      'Category', 'Range', 'Campaign', 'Playbook ID', 'Campaign Archetype', 'Burst', 
      'Media', 'Media Subtype', 'Initial Date', 'End Date', 'Total Weeks', 'Total Budget', 
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'Total WOA', 'Total WOFF', 'Total TRPs', 'Total R1+ (%)', 'Total R3+ (%)'
    ];
    
    // Core fields that must have values (cannot be empty)
    const coreRequiredFields = [
      'Category', 'Range', 'Campaign', 'Campaign Archetype', 'Media', 'Media Subtype', 
      'Initial Date', 'End Date', 'Total Budget', 'Burst'
    ];
    
    // Monthly budget fields - must have values
    const budgetFields = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Other fields that must have values
    const otherRequiredFields = ['Playbook ID', 'Total Weeks', 'Total WOA', 'Total WOFF'];
    
    // Conditional fields - required only for specific media types
    const conditionalFields = ['Total TRPs', 'Total R1+ (%)', 'Total R3+ (%)'];
    
    // Optional fields that can be empty
    const optionalFields = [];
    
    // First, validate ALL expected columns are present (structural validation)
    // This will be handled in the validateRecord method
    
    // Add validation for core required fields (critical - cannot be empty)
    coreRequiredFields.forEach(field => {
      this.rules.push({
        field,
        type: 'required',
        severity: 'critical',
        message: `${field} is required and cannot be empty`,
        validate: (value) => {
          return value !== undefined && value !== null && value.toString().trim() !== '';
        }
      });
    });
    
    // Monthly budget fields (blank values are automatically treated as 0 - no warnings needed)
    
    // Add validation for other required fields (critical - must have values)
    otherRequiredFields.forEach(field => {
      this.rules.push({
        field,
        type: 'required',
        severity: 'critical',
        message: `${field} is required and cannot be empty`,
        validate: (value) => {
          return value !== undefined && value !== null && value.toString().trim() !== '';
        }
      });
    });

    // Add conditional validation for Total TRPs (only required for TV campaigns)
    this.rules.push({
      field: 'Total TRPs',
      type: 'requirement',
      severity: 'critical',
      message: 'Total TRPs is required for TV campaigns and must be a valid number',
      validate: (value, record) => {
        const mediaSubtype = record['Media Subtype']?.toString().toLowerCase() || '';
        const isTvCampaign = mediaSubtype.includes('tv') || mediaSubtype.includes('television') || 
                            mediaSubtype.includes('open tv') || mediaSubtype.includes('paid tv');
        
        if (isTvCampaign) {
          // Total TRPs is required for TV campaigns
          if (!value || value.toString().trim() === '') {
            return {
              isValid: false,
              message: `Total TRPs is required for TV campaign with Media Subtype '${record['Media Subtype']}' and cannot be empty`
            };
          }
          // Validate it's a number
          const numValue = parseFloat(value.toString());
          if (isNaN(numValue) || numValue < 0) {
            return {
              isValid: false,
              message: `Total TRPs must be a valid positive number for TV campaigns. Current value: '${value}'`
            };
          }
        } else {
          // For non-TV campaigns, Total TRPs should be empty or 0
          if (value && value.toString().trim() !== '') {
            const numValue = parseFloat(value.toString());
            // Allow 0 as a valid value for non-TV campaigns
            if (!isNaN(numValue) && numValue === 0) {
              return true;
            }
            return {
              isValid: false,
              message: `Total TRPs should only be used for TV campaigns. Media Subtype '${record['Media Subtype']}' should not have TRP values.`
            };
          }
        }
        return true;
      }
    });

    // Add conditional validation for Total R1+ (%) (required for specific media types, must be %)
    this.rules.push({
      field: 'Total R1+ (%)',
      type: 'requirement',
      severity: 'critical',
      message: 'Total R1+ (%) is required for certain media types and must be a valid percentage',
      validate: (value, record) => {
        const mediaSubtype = record['Media Subtype']?.toString().toLowerCase() || '';
        
        // Required for: PM & FF, Influencer Amplification, Other Digital, Open TV, Paid TV
        const requiresR1Plus = mediaSubtype.includes('pm & ff') || 
                              mediaSubtype.includes('influencer amplification') || 
                              mediaSubtype.includes('influencers amplification') ||
                              mediaSubtype.includes('other digital') ||
                              mediaSubtype.includes('open tv') ||
                              mediaSubtype.includes('paid tv');
        
        if (requiresR1Plus) {
          // R1+ is required
          if (!value || value.toString().trim() === '') {
            return {
              isValid: false,
              message: `Total R1+ (%) is required for Media Subtype '${record['Media Subtype']}' and cannot be empty`
            };
          }
          // Validate it's a valid percentage (0-100)
          const numValue = parseFloat(value.toString().replace('%', ''));
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            return {
              isValid: false,
              message: `Total R1+ (%) must be a valid percentage (0-100%). Current value: '${value}'`
            };
          }
        }
        return true;
      }
    });

    // Add conditional validation for Total R3+ (%) (required for TV only, must be %)
    this.rules.push({
      field: 'Total R3+ (%)',
      type: 'requirement',
      severity: 'critical',
      message: 'Total R3+ (%) is required for TV campaigns and must be a valid percentage',
      validate: (value, record) => {
        const mediaSubtype = record['Media Subtype']?.toString().toLowerCase() || '';
        
        // Required for: Open TV and Paid TV
        const requiresR3Plus = mediaSubtype.includes('open tv') || mediaSubtype.includes('paid tv');
        
        if (requiresR3Plus) {
          // R3+ is required for TV campaigns
          if (!value || value.toString().trim() === '') {
            return {
              isValid: false,
              message: `Total R3+ (%) is required for TV campaign with Media Subtype '${record['Media Subtype']}' and cannot be empty`
            };
          }
          // Validate it's a valid percentage (0-100)
          const numValue = parseFloat(value.toString().replace('%', ''));
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            return {
              isValid: false,
              message: `Total R3+ (%) must be a valid percentage (0-100%). Current value: '${value}'`
            };
          }
        }
        return true;
      }
    });

    // Business unit validation is handled at the data model level, not in the validation grid

    // Add range-to-category validation (supports auto-creation mode)
    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: this.autoCreateMode ? 'warning' : 'critical',
      message: this.autoCreateMode ? 'Range will be auto-created for review' : 'Range must be compatible with the selected Category',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !masterData) return true;
        
        const rangeName = value.toString().trim();
        const categoryName = record['Category']?.toString().trim();
        
        // In auto-creation mode, allow any range
        if (this.autoCreateMode) {
          return true;
        }
        
        // Check if range belongs to category
        const categoryToRanges = masterData.categoryToRanges || {};
        const validRangesForCategory = categoryName ? (categoryToRanges[categoryName] || []) : [];
        
        if (categoryName && validRangesForCategory.length > 0) {
          const isValidRangeForCategory = validRangesForCategory.some((validRange: string) => 
            validRange.toLowerCase() === rangeName.toLowerCase()
          );
          
          if (!isValidRangeForCategory) {
            return {
              isValid: false,
              message: `Range '${rangeName}' is not valid for Category '${categoryName}'. Valid ranges: ${validRangesForCategory.join(', ')}`
            };
          }
        }
        
        return true;
      }
    });

    // Add campaign-to-range validation (supports auto-creation mode)
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: this.autoCreateMode ? 'warning' : 'critical',
      message: this.autoCreateMode ? 'Campaign will be auto-created for review' : 'Campaign must be compatible with the selected Range',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !masterData) return true;
        
        const campaignName = value.toString().trim();
        const rangeName = record['Range']?.toString().trim();
        
        // In auto-creation mode, allow any campaign
        if (this.autoCreateMode) {
          return true;
        }
        
        // Check if campaign belongs to range
        const rangeToCampaigns = masterData.rangeToCampaigns || {};
        const validCampaignsForRange = rangeName ? (rangeToCampaigns[rangeName] || []) : [];
        
        if (rangeName && validCampaignsForRange.length > 0) {
          const isValidCampaignForRange = validCampaignsForRange.some((validCampaign: string) => 
            validCampaign.toLowerCase() === campaignName.toLowerCase()
          );
          
          if (!isValidCampaignForRange) {
            return {
              isValid: false,
              message: `Campaign '${campaignName}' is not valid for Range '${rangeName}'. Valid campaigns: ${validCampaignsForRange.slice(0, 5).join(', ')}${validCampaignsForRange.length > 5 ? '...' : ''}`
            };
          }
        }
        
        return true;
      }
    });

    // Year format validation - make it warning since year can be derived from dates
    this.rules.push({
      field: 'Year',
      type: 'format',
      severity: 'warning', // Changed from critical to warning since it can be derived from dates
      message: 'Year field is empty or invalid - will be derived from Start/End dates',
      validate: (value, record) => {
        // If no year provided, check if we have dates to derive it from
        if (!value || value.toString().trim() === '') {
          if (record['Initial Date'] || record['Start Date'] || record['End Date']) {
            // Year can be derived from dates, so this is just a warning
            return true;
          } else {
            // No dates available to derive year from
            return {
              isValid: false,
              message: 'Year field is required when no Initial Date or End Date is provided'
            };
          }
        }
        
        // If year is provided, validate it's a proper 4-digit year
        const year = parseInt(value.toString());
        const isValid = !isNaN(year) && year >= 2000 && year <= 2100;
        
        if (!isValid) {
          return {
            isValid: false,
            message: `Year must be a valid 4-digit year between 2000-2100. Current value: '${value}'`
          };
        }
        
        return true;
      }
    });

    // Year field consistency validation against financial cycle
    this.rules.push({
      field: 'Year',
      type: 'consistency',
      severity: 'critical',
      message: 'Year field must match the year in Initial Date and End Date',
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
        if (record['Initial Date'] || record['Start Date'] || record['End Date']) {
          const startDate = (record['Initial Date'] || record['Start Date']) ? this.parseDate(record['Initial Date'] || record['Start Date']) : null;
          const endDate = record['End Date'] ? this.parseDate(record['End Date']) : null;
          
          if (startDate) {
            const startYear = startDate.getFullYear();
            if (yearFieldYear !== startYear) {
              console.log(`Year field validation failed against Start Date:`, {
                yearFieldYear,
                startYear,
                yearValue,
                startDate: record['Initial Date'] || record['Start Date']
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
    const dateFields = ['Initial Date', 'End Date'];
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
    const dateFields2 = ['Initial Date', 'End Date'];
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


    // Country validation - special handling for auto-population from selected country
    this.rules.push({
      field: 'Country',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning since it can be auto-populated
      message: 'Country field is empty - will be auto-populated from selected country',
      validate: (value, record, allRecords, masterData) => {
        // If no country value provided, check if we have a selected country to use
        if (!value || value.toString().trim() === '') {
          if (masterData?.selectedCountry) {
            // Country will be auto-populated, so this is just a warning
            return true; // Allow empty country if selectedCountry is available
          } else {
            // No selected country available, this is a problem
            return {
              isValid: false,
              message: 'Country field is required when no country is pre-selected'
            };
          }
        }
        
        // If country value is provided, validate it exists in master data
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

    // Category validation (case-insensitive)
    this.rules.push({
      field: 'Category',
      type: 'relationship',
      severity: 'critical',
      message: 'Category must be a valid category name (case-insensitive match)',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if category exists in master data
        const categoryInput = value.toString().trim();
        const categories = masterData?.categories || [];
        
        // Case-insensitive search - categories array now contains strings directly
        const isValid = categories.some((category: string) => {
          return category.toLowerCase() === categoryInput.toLowerCase();
        });
        
        if (!isValid) {
          console.log(`Category validation failed for '${categoryInput}'. Available categories: [${categories.join(', ')}]`);
          console.log(`Testing case-insensitive matches for '${categoryInput}':`);
          categories.forEach(cat => {
            if (cat.toLowerCase().includes(categoryInput.toLowerCase())) {
              console.log(`  Partial match: '${cat}'`);
            }
          });
        }
        
        return isValid;
      }
    });

    // Range validation - modified for governance support (case-insensitive)
    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning to allow auto-creation
      message: 'Range does not exist and will be auto-created during import',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if range exists in master data
        const rangeInput = value.toString().trim();
        const ranges = masterData?.ranges || [];
        
        // Case-insensitive search - ranges array now contains strings directly
        const exists = ranges.some((range: string) => {
          return range.toLowerCase() === rangeInput.toLowerCase();
        });
        
        if (!exists) {
          console.log(`Range validation: '${rangeInput}' not found in existing ranges. Available ranges: [${ranges.slice(0, 10).join(', ')}...]`);
        }
        
        // Return false if range doesn't exist (to trigger warning highlight)  
        // Return true if range exists (no highlighting needed)
        return exists;
      }
    });

    // Campaign validation - modified for governance support (case-insensitive)
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning to allow auto-creation
      message: 'Campaign does not exist and will be auto-created during import',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check if campaign exists in master data
        const campaignInput = value.toString().trim();
        const campaigns = masterData?.campaigns || [];
        
        // Case-insensitive search - handle both string and object formats
        const exists = campaigns.some((campaign: string | { name: string }) => {
          const campaignName = typeof campaign === 'string' ? campaign : campaign.name;
          return campaignName.toLowerCase() === campaignInput.toLowerCase();
        });
        
        if (!exists) {
          console.log(`Campaign validation: '${campaignInput}' not found in existing campaigns. Will be auto-created.`);
        }
        
        // Return false if campaign doesn't exist (to trigger warning highlight)
        // Return true if campaign exists (no highlighting needed)
        return exists;
      }
    });

    // Category-Range relationship validation - modified for governance support (case-insensitive)
    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning to allow auto-creation
      message: 'Range does not exist and will be auto-created and linked to category during import',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Category) return false;
        
        const category = record.Category.toString().trim();
        const range = value.toString().trim();
        
        // If we have category-to-ranges mapping, use it for existing ranges
        if (masterData?.categoryToRanges) {
          // Find the category in a case-insensitive way
          const categoryKey = Object.keys(masterData.categoryToRanges).find(
            key => key.toLowerCase() === category.toLowerCase()
          );
          
          // Get valid ranges for this category
          const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
          
          // Check if range already exists for category (case-insensitive)
          const exists = validRanges.some((m: string) => 
            m.toLowerCase() === range.toLowerCase()
          );
          
          if (!exists) {
            console.log(`Category-Range relationship: Range '${range}' not found for category '${category}'. Valid ranges: [${validRanges.join(', ')}]`);
          }
          
          // Return false if range doesn't exist (to trigger warning highlight)
          // Return true if range exists (no highlighting needed)
          return exists;
        }
        
        // If no mapping available, assume range doesn't exist (trigger warning)
        return false;
      }
    });
    
    // Campaign-Category relationship validation (new rule to catch invalid combinations)
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'critical',
      message: 'Campaign does not belong to the selected Category',
      validate: (value, record, allRecords, masterData) => {
        // Skip validation if either campaign or category is missing
        if (!value || !record.Category) return true;
        
        const campaignInput = value.toString().trim();
        const categoryInput = record.Category.toString().trim();
        
        // Get the campaign-to-range mapping and range-to-category mapping
        const campaignToRangeMap = masterData?.campaignToRangeMap || {};
        const rangeToCategories = masterData?.rangeToCategories || {};
        
        // If we don't have mapping data, skip validation
        if (Object.keys(campaignToRangeMap).length === 0) {
          return true;
        }
        
        // Find the campaign in our mappings (case-insensitive)
        const campaignKey = Object.keys(campaignToRangeMap).find(
          key => key.toLowerCase() === campaignInput.toLowerCase()
        );
        
        // If campaign exists in mappings
        if (campaignKey) {
          const campaignRange = campaignToRangeMap[campaignKey];
          
          // Get categories that this range belongs to
          const validCategories = rangeToCategories[campaignRange] || [];
          
          // Check if the selected category is valid for this campaign (case-insensitive)
          const isValidCategory = validCategories.some((cat: string) => 
            cat.toLowerCase() === categoryInput.toLowerCase()
          );
          
          if (!isValidCategory) {
            console.log(`Campaign '${campaignInput}' belongs to range '${campaignRange}' which is valid for categories: [${validCategories.join(', ')}], but selected category is '${categoryInput}'`);
            return false;
          }
        }
        
        return true;
      }
    });

    // Campaign-Range relationship validation with compatibility support (supports auto-creation mode)
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',  
      severity: this.autoCreateMode ? 'warning' : 'critical',
      message: this.autoCreateMode ? 'Campaign will be auto-created for review' : 'Campaign does not match the specified Range',
      validate: (value, record, allRecords, masterData) => {
        // Skip validation if either campaign or range is missing
        if (!value || !record.Range) return true;
        
        // In auto-creation mode, allow any campaign
        if (this.autoCreateMode) {
          return true;
        }
        
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
    
    // Budget equals sum of monthly budgets validation
    this.rules.push({
      field: 'Total Budget',
      type: 'consistency',
      severity: 'critical',
      message: 'Total Budget should equal the sum of monthly budgets (Jan-Dec). Budget must be distributed across months.',
      validate: (value, record) => {
        // Total budget is required - cannot be blank/empty
        if (!value) return false;
        
        // Parse the budget
        const budget = this.parseNumber(value);
        if (budget === null || budget <= 0) return false; // Invalid or zero budget
        
        // Parse monthly budgets with flexible field names
        const jan = this.parseNumber(record['Jan'] || record['Jan Budget'] || record['January'] || 0) || 0;
        const feb = this.parseNumber(record['Feb'] || record['Feb Budget'] || record['February'] || 0) || 0;
        const mar = this.parseNumber(record['Mar'] || record['Mar Budget'] || record['March'] || 0) || 0;
        const apr = this.parseNumber(record['Apr'] || record['Apr Budget'] || record['April'] || 0) || 0;
        const may = this.parseNumber(record['May'] || record['May Budget'] || 0) || 0;
        const jun = this.parseNumber(record['Jun'] || record['Jun Budget'] || record['June'] || 0) || 0;
        const jul = this.parseNumber(record['Jul'] || record['Jul Budget'] || record['July'] || 0) || 0;
        const aug = this.parseNumber(record['Aug'] || record['Aug Budget'] || record['August'] || 0) || 0;
        const sep = this.parseNumber(record['Sep'] || record['Sep Budget'] || record['September'] || 0) || 0;
        const oct = this.parseNumber(record['Oct'] || record['Oct Budget'] || record['October'] || 0) || 0;
        const nov = this.parseNumber(record['Nov'] || record['Nov Budget'] || record['November'] || 0) || 0;
        const dec = this.parseNumber(record['Dec'] || record['Dec Budget'] || record['December'] || 0) || 0;
        
        // Calculate sum
        const sum = jan + feb + mar + apr + may + jun + jul + aug + sep + oct + nov + dec;
        
        // Check if we have any monthly budget data
        const monthlyBudgets = [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec];
        const hasMonthlyData = monthlyBudgets.some(month => month > 0);
        
        // REQUIREMENT: If total budget exists, there MUST be monthly distribution
        if (!hasMonthlyData) {
          return false; // Critical error: no monthly budget distribution
        }
        
        // Special case: If only one month has budget and it equals the total budget,
        // consider it valid (common pattern in media planning)
        const nonZeroMonths = monthlyBudgets.filter(m => m > 0).length;
        const singleMonthMatchesTotal = nonZeroMonths === 1 && monthlyBudgets.some(month => 
          Math.abs(month - budget) < 0.01
        );
        
        if (singleMonthMatchesTotal) {
          return true;
        }
        
        // Check if sum equals budget (with small tolerance for floating point errors)
        const tolerance = 0.01; // 1 cent tolerance
        const isEqual = Math.abs(sum - budget) < tolerance;
        
        console.log('Budget validation:', {
          budget,
          monthlyBudgets: { jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec },
          sum,
          hasMonthlyData,
          nonZeroMonths,
          singleMonthMatchesTotal,
          isEqual
        });
        
        return isEqual;
      }
    });

    // Total WOFF validation - should equal Total Weeks minus Total WOA
    this.rules.push({
      field: 'Total WOFF',
      type: 'consistency',
      severity: 'critical',
      message: 'Total WOFF should equal Total Weeks minus Total WOA (Total WOFF = Total Weeks - Total WOA)',
      validate: (value, record) => {
        if (!value) return true; // Skip if no WOFF value
        
        // Parse all required values
        const woff = this.parseNumber(value);
        const totalWeeks = this.parseNumber(record['Total Weeks']);
        const totalWOA = this.parseNumber(record['Total WOA']);
        
        // Skip validation if any values are missing or invalid
        if (woff === null || totalWeeks === null || totalWOA === null) {
          return true; // Other validation rules will catch missing/invalid numbers
        }
        
        // Calculate expected WOFF: Total Weeks - Total WOA
        const expectedWOFF = totalWeeks - totalWOA;
        
        // Check if WOFF matches the formula (with small tolerance for floating point errors)
        const tolerance = 0.01;
        const isCorrect = Math.abs(woff - expectedWOFF) < tolerance;
        
        if (!isCorrect) {
          console.log('WOFF validation failed:', {
            providedWOFF: woff,
            totalWeeks,
            totalWOA,
            expectedWOFF,
            difference: Math.abs(woff - expectedWOFF)
          });
        }
        
        return isCorrect;
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

    // Media validation (backward compatibility for old field name)
    this.rules.push({
      field: 'Media Type',
      type: 'relationship',
      severity: 'critical',
      message: 'Media Type field detected - please rename to Media for consistency',
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
        // Check for both 'Media' and 'Media Type' field names (backward compatibility)
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
      severity: 'critical',
      message: 'End Date must be after Initial Date',
      validate: (value, record) => {
        const initialDate = record['Initial Date'] || record['Start Date'];
        if (!value || !initialDate) return true; // Not critical
        
        const startDate = this.parseDate(initialDate);
        const endDate = this.parseDate(value);
        
        if (!startDate || !endDate) return true; // Can't validate
        
        return endDate >= startDate;
      }
    });

    // ABP year validation for Initial Date
    if (this.abpYear) {
      this.rules.push({
        field: 'Initial Date',
        type: 'relationship',
        severity: 'critical',
        message: `Initial Date must be in ${this.abpYear} to match the selected ABP cycle`,
        validate: (value, record) => {
          if (!value) return true; // Will be caught by required validation
          
          const date = this.parseDate(value);
          if (!date) {
            console.log('ABP Initial Date validation: Failed to parse date', value);
            return true; // Will be caught by format validation
          }
          
          const year = date.getFullYear();
          const isValid = year === this.abpYear;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`ABP Initial Date validation: "${value}" -> year ${year}, ABP year ${this.abpYear}, valid: ${isValid}`);
          }
          
          return isValid;
        }
      });

      this.rules.push({
        field: 'End Date',
        type: 'relationship',
        severity: 'critical',
        message: `End Date must be in ${this.abpYear} to match the selected ABP cycle`,
        validate: (value, record) => {
          if (!value) return true; // Will be caught by required validation
          
          const date = this.parseDate(value);
          if (!date) {
            console.log('ABP End Date validation: Failed to parse date', value);
            return true; // Will be caught by format validation
          }
          
          const year = date.getFullYear();
          const isValid = year === this.abpYear;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`ABP End Date validation: "${value}" -> year ${year}, ABP year ${this.abpYear}, valid: ${isValid}`);
          }
          
          return isValid;
        }
      });

      // Cross-year validation: Both dates must be in the same year (campaigns can't span multiple years)
      this.rules.push({
        field: 'End Date',
        type: 'relationship',
        severity: 'critical',
        message: 'Initial Date and End Date must be in the same year - campaigns cannot span multiple years',
        validate: (value, record) => {
          const initialDate = record['Initial Date'] || record['Start Date'];
          if (!initialDate || !value) return true; // Will be caught by required validation
          
          const startDate = this.parseDate(initialDate);
          const endDate = this.parseDate(value);
          
          if (!startDate || !endDate) return true; // Will be caught by format validation
          
          const startYear = startDate.getFullYear();
          const endYear = endDate.getFullYear();
          const isValid = startYear === endYear;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Cross-year validation: Initial "${initialDate}" (${startYear}) vs End "${value}" (${endYear}), valid: ${isValid}`);
          }
          
          return isValid;
        }
      });
    }

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
          startDate: (record['Initial Date'] || record['Start Date']) ? this.formatDate(this.parseDate(record['Initial Date'] || record['Start Date'])) : '',
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
            startDate: (otherRecord['Initial Date'] || otherRecord['Start Date']) ? this.formatDate(this.parseDate(otherRecord['Initial Date'] || otherRecord['Start Date'])) : '',
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
        
        const mediaType = record['Media'] || record['Media Type']?.toString().trim();
        const mediaSubtype = record['Media Subtype'] || record['Media Sub Type']?.toString().trim();
        
        // Check if it's a TV media type
        const isTvMedia = mediaType?.toLowerCase().includes('traditional') ||
                         mediaType?.toLowerCase().includes('tv') ||
                         mediaSubtype?.toLowerCase().includes('tv') ||
                         mediaSubtype?.toLowerCase().includes('television') ||
                         mediaSubtype?.toLowerCase().includes('open') ||
                         mediaSubtype?.toLowerCase().includes('paid');
        
        if (!isTvMedia) {
          // Allow 0 as a valid value for non-TV media types
          const numValue = parseFloat(value.toString());
          if (!isNaN(numValue) && numValue === 0) {
            return true;
          }
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
        const mediaType = record['Media'] || record['Media Type']?.toString().trim();
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

    // Range validation - check if range exists and is linked to category (governance-aware)
    this.rules.push({
      field: 'Range',
      type: 'relationship', 
      severity: 'warning', // Changed from critical to warning to allow auto-creation
      message: 'Range does not exist in database and will be auto-created and linked to category',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const rangeName = value.toString().trim();
        const categoryName = record['Category']?.toString().trim();
        
        // Check if range exists (ranges are returned as array of strings)
        const ranges = masterData?.ranges || [];
        const rangeExists = ranges.some((range: string) => 
          range.toLowerCase() === rangeName.toLowerCase()
        );
        
        // If range doesn't exist, return false to trigger warning (will be auto-created)
        if (!rangeExists) return false;
        
        // If range exists, check if it's linked to category
        const categoryToRanges = masterData?.categoryToRanges || {};
        const categoryRanges = categoryName ? (categoryToRanges[categoryName] || []) : [];
        const isLinked = categoryRanges.some((range: string) => 
          range.toLowerCase() === rangeName.toLowerCase()
        );
        
        // Return false if not linked (will trigger warning about linking during import)
        // Return true if properly linked (no warning needed)
        return isLinked;
      }
    });

    // Campaign validation - check if campaign exists (governance-aware)
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning to allow auto-creation
      message: 'Campaign does not exist in database and will be auto-created during import',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        const campaignName = value.toString().trim();
        const campaigns = masterData?.campaigns || [];
        // Handle both string and object formats for campaigns
        const exists = campaigns.some((campaign: string | { name: string }) => {
          const cName = typeof campaign === 'string' ? campaign : campaign.name;
          return cName.toLowerCase() === campaignName.toLowerCase();
        });
        
        // Return false if campaign doesn't exist (to trigger warning highlight)
        // Return true if campaign exists (no highlighting needed)
        return exists;
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
        // Check for both 'Media' and 'Media Type' field names (backward compatibility)
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
        const mediaType = record['Media'] || record['Media Type']?.toString().trim();
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

    // Campaign Archetype validation
    this.rules.push({
      field: 'Campaign Archetype',
      type: 'relationship',
      severity: 'critical',
      message: 'Campaign Archetype must be a valid type from the predefined list',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        // Check against predefined campaign archetype values
        const archetypeInput = value.toString().trim();
        const validArchetypes = [
          'Innovation',
          'Base Business (Maintenance)',
          'Range Extension'
        ];
        
        // Case-insensitive search
        return validArchetypes.some(archetype => 
          archetype.toLowerCase() === archetypeInput.toLowerCase()
        );
      }
    });

    // Category-Range cross-reference validation (supports auto-creation mode)
    this.rules.push({
      field: 'Range',
      type: 'cross_reference',
      severity: this.autoCreateMode ? 'warning' : 'critical',
      message: this.autoCreateMode ? 'Range will be auto-created for review' : 'Range does not belong to the specified Category',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Category || !masterData) return true;
        
        // In auto-creation mode, allow any range
        if (this.autoCreateMode) {
          return true;
        }
        
        const categoryName = record.Category.toString().trim();
        const rangeName = value.toString().trim();
        
        // Get category-to-ranges mapping
        const categoryToRanges = masterData.categoryToRanges || {};
        
        // Find valid ranges for this category (case-insensitive)
        const categoryKey = Object.keys(categoryToRanges).find(key => 
          key.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (!categoryKey) {
          // Category not found in master data, let other validations handle this
          return true;
        }
        
        const validRanges = categoryToRanges[categoryKey] || [];
        
        // Check if range is valid for this category (case-insensitive)
        const isValidRange = validRanges.some(validRange => 
          validRange.toLowerCase() === rangeName.toLowerCase()
        );
        
        if (!isValidRange) {
          return {
            isValid: false,
            message: `Range '${rangeName}' is not valid for Category '${categoryName}'. Valid ranges: ${validRanges.slice(0, 5).join(', ')}${validRanges.length > 5 ? '...' : ''}`
          };
        }
        
        return true;
      }
    });

    // Range-Campaign cross-reference validation
    this.rules.push({
      field: 'Campaign',
      type: 'cross_reference',
      severity: this.autoCreateMode ? 'warning' : 'critical',
      message: this.autoCreateMode ? 'Campaign will be auto-created for review' : 'Campaign does not belong to the specified Range',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Range || !masterData) return true;
        
        // In auto-creation mode, allow any campaign
        if (this.autoCreateMode) {
          return true;
        }
        
        const campaignName = value.toString().trim();
        const rangeName = record.Range.toString().trim();
        
        // Get range-to-campaigns mapping
        const rangeToCampaigns = masterData.rangeToCampaigns || {};
        
        // Find valid campaigns for this range (case-insensitive)
        const rangeKey = Object.keys(rangeToCampaigns).find(key => 
          key.toLowerCase() === rangeName.toLowerCase()
        );
        
        if (!rangeKey) {
          // Range not found in master data, let other validations handle this
          return true;
        }
        
        const validCampaigns = rangeToCampaigns[rangeKey] || [];
        
        // Check if campaign is valid for this range (case-insensitive)
        const isValidCampaign = validCampaigns.some((validCampaign: string) => 
          validCampaign.toLowerCase() === campaignName.toLowerCase()
        );
        
        if (!isValidCampaign) {
          return {
            isValid: false,
            message: `Campaign '${campaignName}' is not valid for Range '${rangeName}'. Valid campaigns: ${validCampaigns.slice(0, 5).join(', ')}${validCampaigns.length > 5 ? '...' : ''}`
          };
        }
        
        return true;
      }
    });

    // Category-Range-Campaign consistency validation (supports auto-creation mode)
    this.rules.push({
      field: 'Category',
      type: 'cross_reference',
      severity: this.autoCreateMode ? 'warning' : 'critical',
      message: this.autoCreateMode ? 'Entities will be auto-created for review' : 'Category, Range, and Campaign combination is inconsistent',
      validate: (value, record, allRecords, masterData) => {
        if (!value || !record.Range || !record.Campaign || !masterData) return true;
        
        // In auto-creation mode, skip cross-reference validation
        if (this.autoCreateMode) {
          return true;
        }
        
        const categoryName = value.toString().trim();
        const rangeName = record.Range.toString().trim();
        const campaignName = record.Campaign.toString().trim();
        
        // Get all mappings
        const categoryToRanges = masterData.categoryToRanges || {};
        const rangeToCampaigns = masterData.rangeToCampaigns || {};
        const rangeToCategories = masterData.rangeToCategories || {};
        
        // First, verify the range belongs to the category
        const categoryKey = Object.keys(categoryToRanges).find(key => 
          key.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (categoryKey) {
          const validRanges = categoryToRanges[categoryKey] || [];
          const rangeValid = validRanges.some(validRange => 
            validRange.toLowerCase() === rangeName.toLowerCase()
          );
          
          if (!rangeValid) {
            return {
              isValid: false,
              message: `Inconsistent data: Range '${rangeName}' does not belong to Category '${categoryName}'`
            };
          }
        }
        
        // Second, verify the campaign belongs to the range
        const rangeKey = Object.keys(rangeToCampaigns).find(key => 
          key.toLowerCase() === rangeName.toLowerCase()
        );
        
        if (rangeKey) {
          const validCampaigns = rangeToCampaigns[rangeKey] || [];
          const campaignValid = validCampaigns.some((validCampaign: string) => 
            validCampaign.toLowerCase() === campaignName.toLowerCase()
          );
          
          if (!campaignValid) {
            return {
              isValid: false,
              message: `Inconsistent data: Campaign '${campaignName}' does not belong to Range '${rangeName}'`
            };
          }
        }
        
        // Third, verify the range's category matches what we expect
        const rangeToCategory = Object.keys(rangeToCategories).find(key => 
          key.toLowerCase() === rangeName.toLowerCase()
        );
        
        if (rangeToCategory) {
          const expectedCategories = rangeToCategories[rangeToCategory] || [];
          const categoryMatches = expectedCategories.some(expectedCategory => 
            expectedCategory.toLowerCase() === categoryName.toLowerCase()
          );
          
          if (!categoryMatches) {
            return {
              isValid: false,
              message: `Inconsistent data: Range '${rangeName}' should belong to categories [${expectedCategories.join(', ')}], not '${categoryName}'`
            };
          }
        }
        
        return true;
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

    // First check if ALL expected columns are present (only check on first record to avoid duplicates)
    if (index === 0) {
      const allExpectedColumns = [
        'Category', 'Range', 'Campaign', 'Playbook ID', 'Campaign Archetype', 'Burst',
        'Media', 'Media Subtype', 'Initial Date', 'End Date', 'Total Weeks', 'Total Budget',
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        'Total WOA', 'Total WOFF', 'Total R1+ (%)', 'Total R3+ (%)'
      ];

      const presentColumns = Object.keys(record);
      const missingColumns = allExpectedColumns.filter(col => {
        // Check with flexible naming
        if (col === 'Media') {
          return !presentColumns.includes('Media') && !presentColumns.includes('Media Type');
        } else if (col === 'Media Subtype') {
          return !presentColumns.includes('Media Subtype') && !presentColumns.includes('Media Sub Type');
        } else if (col === 'Initial Date') {
          return !presentColumns.includes('Initial Date') && !presentColumns.includes('Start Date');
        } else if (col === 'Total Budget') {
          return !presentColumns.includes('Total Budget') && !presentColumns.includes('Budget');
        } else if (col === 'Total WOA') {
          return !presentColumns.includes('Total WOA') && !presentColumns.includes('Weeks Off Air') && !presentColumns.includes('Total WOFF');
        } else if (col === 'Total WOFF') {
          return !presentColumns.includes('Total WOFF') && !presentColumns.includes('W Off Air') && !presentColumns.includes('Total WOA');
        } else if (col === 'Total R1+ (%)') {
          return !presentColumns.includes('Total R1+ (%)') && !presentColumns.includes('Total R1+') && !presentColumns.includes('R1+');
        } else if (col === 'Total R3+ (%)') {
          return !presentColumns.includes('Total R3+ (%)') && !presentColumns.includes('Total R3+') && !presentColumns.includes('R3+');
        } else {
          return !presentColumns.includes(col);
        }
      });

      // Add critical issues for missing columns
      missingColumns.forEach(col => {
        issues.push({
          rowIndex: index,
          columnName: col,
          severity: 'critical',
          message: `Missing required column '${col}' in CSV file - ALL columns must be present`,
          currentValue: undefined
        });
      });
    }
    
    // Apply each validation rule
    for (const rule of this.rules) {
      // For required field validation, we need to check even if field doesn't exist
      // For other validations, skip if field doesn't exist in record
      if (!(rule.field in record)) {
        // Only continue with validation if this is a required field rule
        if (rule.type === 'required' && rule.severity === 'critical') {
          // Field is completely missing from CSV - this is a critical error
          const issue: ValidationIssue = {
            rowIndex: index,
            columnName: rule.field,
            severity: 'critical',
            message: `Missing required column '${rule.field}' in CSV file`,
            currentValue: undefined
          };
          issues.push(issue);
        }
        continue;
      }
      
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
  
  // Getter for ABP year for testing
  public getAbpYear(): number | null {
    return this.abpYear;
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
