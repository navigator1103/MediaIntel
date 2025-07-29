import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Field mapping for MediaSufficiency table (excluding auto-filled fields)
const FIELD_MAPPING = {
  // Auto-populated fields removed: Last Update, Sub Region, Country, BU
  'Category': 'category',
  'Range': 'range',
  'Campaign': 'campaign',
  // TV Demographics & Targeting
  'TV Demo Gender': 'tvDemoGender',
  'TV Demo Min. Age': 'tvDemoMinAge',
  'TV Demo Max. Age': 'tvDemoMaxAge',
  'TV SEL': 'tvSel',
  'Final TV Target (don\'t fill)': 'finalTvTarget',
  'TV Target Size': 'tvTargetSize',
  'TV Copy Length': 'tvCopyLength',
  // TV Performance Metrics
  'Total TV Planned R1+ (%)': 'tvPlannedR1Plus',
  'Total TV Planned R3+ (%)': 'tvPlannedR3Plus',
  'TV Optimal R1+': 'tvPotentialR1Plus',
  'CPP 2024': 'cpp2024',
  'CPP 2025': 'cpp2025',
  'CPP 2026': 'cpp2026',
  'Reported Currency': 'reportedCurrency',
  // Digital Demographics & Targeting
  'Is Digital target the same than TV?': 'isDigitalTargetSameAsTv',
  'Digital Demo Gender': 'digitalDemoGender',
  'Digital Demo Min. Age': 'digitalDemoMinAge',
  'Digital Demo Max. Age': 'digitalDemoMaxAge',
  'Digital SEL': 'digitalSel',
  'Final Digital Target (don\'t fill)': 'finalDigitalTarget',
  'Digital Target Size (Abs)': 'digitalTargetSizeAbs',
  // Digital Performance Metrics
  'Total Digital Planned R1+': 'digitalPlannedR1Plus',
  'Total Digital Optimal R1+': 'digitalPotentialR1Plus',
  // Combined Metrics
  'Planned Combined Reach (Don\'t fill)': 'plannedCombinedReach',
  'Combined Potential Reach': 'combinedPotentialReach'
};

// Required fields for validation (excluding auto-filled fields from user selections)
const REQUIRED_FIELDS = [
  'Category',
  'Range',
  'Campaign'
];

interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
}

// Field validation definitions
const FIELD_VALIDATIONS = {
  // String fields - should contain only text/letters/spaces
  stringFields: [
    'Category', 'Range', 'Campaign', 'TV Copy Length'
  ],
  
  // Numeric fields - should be valid numbers (can include commas)
  numericFields: [
    'Total Country Population On Target', 'TV Target Size', 'WOA Open TV', 'WOA Paid TV', 
    'Total TRPs', 'CPP 2024', 'CPP 2025', 'CPP 2026', 'Digital Target Size (Abs)', 'WOA PM FF', 'WOA Influencers Amplification',
    'TV Demo Min. Age', 'TV Demo Max. Age', 'Digital Demo Min. Age', 'Digital Demo Max. Age'
  ],
  
  // Percentage fields - should be 0%-100% format only (reach fields can be 0%)
  reachPercentageFields: [
    'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Optimal R1+', 'Total Digital Planned R1+', 'Total Digital Optimal R1+',
    'Planned Combined Reach (Don\'t fill)', 'Combined Potential Reach'
  ],
  
  // Percentage fields that must be 1%-100% (cannot be 0%)
  nonZeroPercentageFields: [
    'Combined Potential Reach'
  ],
  
  // Date fields - should be valid dates
  dateFields: [],
  
  // Enum/Choice fields with allowed values (removed reach level fields as they are now percentage fields)
  reachLevelFields: {
    // Reach level fields moved to percentage validation
  },
  
  // Gender fields with allowed values
  genderFields: {
    'TV Demo Gender': ['M', 'F', 'BG'],
    'Digital Demo Gender': ['M', 'F', 'BG']
  },
  
  // Currency fields with allowed values
  currencyFields: {
    'Reported Currency': ['XUA', 'AFN', 'DZD', 'ARS', 'AMD', 'AWG', 'AUD', 'AZN', 'BSD', 'BHD', 'THB', 'PAB', 'BBD', 'BYN', 'BZD', 'BMD', 'BOB', 'VEF', 'XBA', 'XBB', 'XBD', 'XBC', 'BRL', 'BND', 'BGN', 'BIF', 'XOF', 'XAF', 'XPF', 'CVE', 'CAD', 'KYD', 'CLP', 'XTS', 'COP', 'KMF', 'CDF', 'BAM', 'NIO', 'CRC', 'CUP', 'CZK', 'GMD', 'DKK', 'MKD', 'DJF', 'STD', 'DOP', 'VND', 'XCD', 'EGP', 'SVC', 'ETB', 'EUR', 'FKP', 'FJD', 'HUF', 'GHS', 'GIP', 'XAU', 'HTG', 'PYG', 'GNF', 'GYD', 'HKD', 'UAH', 'ISK', 'INR', 'IRR', 'IQD', 'JMD', 'JOD', 'KES', 'PGK', 'LAK', 'HRK', 'KWD', 'AOA', 'MMK', 'GEL', 'LBP', 'ALL', 'HNL', 'SLL', 'LRD', 'LYD', 'SZL', 'LSL', 'MGA', 'MWK', 'MYR', 'MUR', 'MXN', 'MDL', 'MAD', 'MZN', 'NGN', 'ERN', 'NAD', 'NPR', 'ANG', 'ILS', 'TWD', 'NZD', 'BTN', 'KPW', 'NOK', 'MRO', 'PKR', 'XPD', 'MOP', 'TOP', 'CUC', 'UYU', 'PHP', 'XPT', 'GBP', 'BWP', 'QAR', 'GTQ', 'ZAR', 'OMR', 'KHR', 'RON', 'MVR', 'IDR', 'RUB', 'RWF', 'XDR', 'SHP', 'SAR', 'RSD', 'SCR', 'XAG', 'SGD', 'PEN', 'SBD', 'KGS', 'SOS', 'TJS', 'SSP', 'LKR', 'XSU', 'SDG', 'SRD', 'SEK', 'CHF', 'SYP', 'BDT', 'WST', 'TZS', 'KZT', 'XXX', 'TTD', 'MNT', 'TND', 'TRY', 'TMT', 'AED', 'USD', 'UGX', 'UZS', 'VUV', 'KRW', 'YER', 'JPY', 'CNY', 'ZMW', 'ZWL', 'PLN']
  }
};

// TV fields that must be validated against game plans
const TV_FIELDS = [
  // TV Demographics & Targeting
  'TV Demo Gender',
  'TV Demo Min. Age',
  'TV Demo Max. Age',
  'TV SEL',
  'TV Target Size',
  'TV Copy Length',
  // TV Performance Metrics
  'Total TV Planned R1+ (%)',
  'Total TV Planned R3+ (%)',
  'TV Optimal R1+',
  'CPP 2024',
  'CPP 2025',
  'CPP 2026'
];

// Digital fields that must be validated against game plans
const DIGITAL_FIELDS = [
  // Always required for Digital campaigns
  'Is Digital target the same than TV?',
  'Digital Target Size (Abs)',
  // Digital Performance Metrics
  'Total Digital Planned R1+',
  'Total Digital Optimal R1+'
];

// Digital demographic fields (only required if different from TV)
const DIGITAL_DEMO_FIELDS = [
  'Digital Demo Gender',
  'Digital Demo Min. Age', 
  'Digital Demo Max. Age',
  'Digital SEL'
];

// Cross-reference validation against game plans
async function validateAgainstGamePlans(
  records: any[], 
  countryId: number, 
  lastUpdateId: number
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  try {
    console.log(`Querying game plans for countryId: ${countryId}, lastUpdateId: ${lastUpdateId}`);
    
    // Get all game plans for this country + financial cycle (with limit to prevent memory issues)
    const gamePlans = await prisma.gamePlan.findMany({
      where: {
        countryId: countryId,
        last_update_id: lastUpdateId
      },
      include: {
        campaign: {
          include: {
            range: true
          }
        },
        category: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        }
      },
      take: 10000 // Limit to prevent memory issues
    });
    
    console.log(`Found ${gamePlans.length} game plans to validate against`);

    // Collect all categories, ranges, and campaigns from game plans
    const gamePlanCategories = new Set<string>();
    const gamePlanRanges = new Set<string>();
    const campaignMediaTypes = new Map<string, Set<string>>();
    
    gamePlans.forEach(plan => {
      // Collect categories
      if (plan.category?.name) {
        gamePlanCategories.add(plan.category.name);
      }
      
      // Collect ranges
      if (plan.campaign?.range?.name) {
        gamePlanRanges.add(plan.campaign.range.name);
      }
      
      // Collect campaigns and their media types
      const campaignName = plan.campaign?.name;
      const mediaType = plan.mediaSubType?.mediaType?.name;
      
      if (campaignName && mediaType) {
        if (!campaignMediaTypes.has(campaignName)) {
          campaignMediaTypes.set(campaignName, new Set());
        }
        campaignMediaTypes.get(campaignName)!.add(mediaType);
      }
    });

    console.log(`Game plans contain: ${gamePlanCategories.size} categories, ${gamePlanRanges.size} ranges, ${campaignMediaTypes.size} campaigns`);
    console.log('Categories in game plans:', Array.from(gamePlanCategories));
    console.log('Ranges in game plans:', Array.from(gamePlanRanges));
    console.log('Campaigns in game plans:', Array.from(campaignMediaTypes.keys()));

    // Validate each record against game plans
    console.log(`Starting validation of ${records.length} records against game plans`);
    
    records.forEach((record, rowIndex) => {
      if (rowIndex % 100 === 0 && rowIndex > 0) {
        console.log(`Processed ${rowIndex}/${records.length} records`);
      }
      
      const categoryName = record['Category'];
      const rangeName = record['Range'];
      const campaignName = record['Campaign'];
      
      // Validate Category exists in game plans
      if (categoryName) {
        if (!gamePlanCategories.has(categoryName)) {
          issues.push({
            rowIndex,
            columnName: 'Category',
            severity: 'critical',
            message: `Category "${categoryName}" does not exist in game plans for this country/financial cycle.`,
            currentValue: categoryName
          });
        }
      }
      
      // Validate Range exists in game plans
      if (rangeName) {
        if (!gamePlanRanges.has(rangeName)) {
          issues.push({
            rowIndex,
            columnName: 'Range',
            severity: 'critical',
            message: `Range "${rangeName}" does not exist in game plans for this country/financial cycle.`,
            currentValue: rangeName
          });
        }
      }
      
      // Validate Campaign exists in game plans
      if (!campaignName) {
        return; // Skip if no campaign name
      }

      const mediaTypes = campaignMediaTypes.get(campaignName);
      
      if (!mediaTypes) {
        // No game plans found for this campaign
        issues.push({
          rowIndex,
          columnName: 'Campaign',
          severity: 'critical',
          message: `Campaign "${campaignName}" does not exist in game plans for this country/financial cycle.`,
          currentValue: campaignName
        });
        return;
      }

      const hasTvMedia = mediaTypes.has('TV') || mediaTypes.has('Traditional');
      const hasDigitalMedia = mediaTypes.has('Digital');
      console.log(`Campaign "${campaignName}" has TV media: ${hasTvMedia}, Digital media: ${hasDigitalMedia}, Media types: ${Array.from(mediaTypes)}`);

      // Check TV fields validation
      TV_FIELDS.forEach(fieldName => {
        const fieldValue = record[fieldName];
        const hasValue = fieldValue && fieldValue.toString().trim() !== '';

        if (hasTvMedia && !hasValue) {
          // Campaign has TV media in game plans but TV field is empty
          issues.push({
            rowIndex,
            columnName: fieldName,
            severity: 'critical',
            message: `${fieldName} is required because campaign "${campaignName}" has TV media in game plans for this country/financial cycle.`,
            currentValue: fieldValue || ''
          });
        } else if (!hasTvMedia && hasValue) {
          // Campaign has NO TV media in game plans but TV field has value
          // Check if this is a TV reach field - those should be critical errors for Digital-only campaigns
          const tvReachFields = ['Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Optimal R1+'];
          const severity = tvReachFields.includes(fieldName) ? 'critical' : 'warning';
          const message = tvReachFields.includes(fieldName) 
            ? `${fieldName} must be empty because campaign "${campaignName}" has no TV media in game plans for this country/financial cycle.`
            : `${fieldName} should be empty because campaign "${campaignName}" has no TV media in game plans for this country/financial cycle.`;
          
          issues.push({
            rowIndex,
            columnName: fieldName,
            severity,
            message,
            currentValue: fieldValue
          });
        }
      });

      // Check Digital fields validation
      DIGITAL_FIELDS.forEach(fieldName => {
        const fieldValue = record[fieldName];
        const hasValue = fieldValue && fieldValue.toString().trim() !== '';

        if (hasDigitalMedia && !hasValue) {
          // Campaign has Digital media in game plans but Digital field is empty
          issues.push({
            rowIndex,
            columnName: fieldName,
            severity: 'critical',
            message: `${fieldName} is required because campaign "${campaignName}" has Digital media in game plans for this country/financial cycle.`,
            currentValue: fieldValue || ''
          });
        } else if (!hasDigitalMedia && hasValue) {
          // Campaign has NO Digital media in game plans but Digital field has value
          // Check if this is a Digital reach field - those should be critical errors for TV-only campaigns
          const digitalReachFields = ['Total Digital Planned R1+', 'Total Digital Optimal R1+'];
          const severity = digitalReachFields.includes(fieldName) ? 'critical' : 'warning';
          const message = digitalReachFields.includes(fieldName)
            ? `${fieldName} must be empty because campaign "${campaignName}" has no Digital media in game plans for this country/financial cycle.`
            : `${fieldName} should be empty because campaign "${campaignName}" has no Digital media in game plans for this country/financial cycle.`;
          
          issues.push({
            rowIndex,
            columnName: fieldName,
            severity,
            message,
            currentValue: fieldValue
          });
        }
      });

      // Check Digital demographic fields validation (only if different from TV)
      if (hasDigitalMedia) {
        const isDigitalTargetSameAsTv = record['Is Digital target the same than TV?'];
        const sameAsTV = isDigitalTargetSameAsTv && (
          isDigitalTargetSameAsTv.toString().toLowerCase() === 'yes' ||
          isDigitalTargetSameAsTv.toString().toLowerCase() === 'y' ||
          isDigitalTargetSameAsTv.toString().toLowerCase() === 'true'
        );

        DIGITAL_DEMO_FIELDS.forEach(fieldName => {
          const fieldValue = record[fieldName];
          const hasValue = fieldValue && fieldValue.toString().trim() !== '';

          if (!sameAsTV && !hasValue) {
            // Digital target is different from TV but demographic field is empty
            issues.push({
              rowIndex,
              columnName: fieldName,
              severity: 'critical',
              message: `${fieldName} is required because campaign "${campaignName}" has Digital media and digital target is different from TV target.`,
              currentValue: fieldValue || ''
            });
          } else if (sameAsTV && hasValue) {
            // Digital target is same as TV but demographic field has value
            issues.push({
              rowIndex,
              columnName: fieldName,
              severity: 'warning',
              message: `${fieldName} should be empty when digital target is the same as TV target.`,
              currentValue: fieldValue
            });
          }
        });
      } else if (hasTvMedia && !hasDigitalMedia) {
        // Campaign is TV-only - warn if Digital demographic fields are filled
        const digitalDemoFieldsToCheck = [
          'Digital Demo Gender',
          'Digital Demo Min. Age', 
          'Digital Demo Max. Age',
          'Digital SEL',
          'Final Digital Target (don\'t fill)'
        ];
        
        digitalDemoFieldsToCheck.forEach(fieldName => {
          const fieldValue = record[fieldName];
          const hasValue = fieldValue && fieldValue.toString().trim() !== '';
          
          if (hasValue) {
            issues.push({
              rowIndex,
              columnName: fieldName,
              severity: 'warning',
              message: `${fieldName} should be empty because campaign "${campaignName}" has only TV media in game plans for this country/financial cycle.`,
              currentValue: fieldValue
            });
          }
        });
      }

      // Additional validation for campaigns with both TV and Digital media
      if (hasTvMedia && hasDigitalMedia) {
        // Both TV and Digital fields should be filled
        const allRequiredFields = [...TV_FIELDS, ...DIGITAL_FIELDS];
        allRequiredFields.forEach(fieldName => {
          const fieldValue = record[fieldName];
          const hasValue = fieldValue && fieldValue.toString().trim() !== '';
          
          if (!hasValue) {
            issues.push({
              rowIndex,
              columnName: fieldName,
              severity: 'critical',
              message: `${fieldName} is required because campaign "${campaignName}" has both TV and Digital media in game plans for this country/financial cycle.`,
              currentValue: fieldValue || ''
            });
          }
        });

        // Combined Potential Reach is required when campaign has both TV and Digital media
        const combinedPotentialReach = record['Combined Potential Reach'];
        if (!combinedPotentialReach || combinedPotentialReach.toString().trim() === '') {
          issues.push({
            rowIndex,
            columnName: 'Combined Potential Reach',
            severity: 'critical',
            message: `Combined Potential Reach is required because campaign "${campaignName}" has both TV and Digital media in game plans for this country/financial cycle.`,
            currentValue: combinedPotentialReach || ''
          });
        }

        // "Is Digital target the same than TV?" is required when campaign has both TV and Digital media
        const isDigitalTargetSameAsTv = record['Is Digital target the same than TV?'];
        if (!isDigitalTargetSameAsTv || isDigitalTargetSameAsTv.toString().trim() === '') {
          issues.push({
            rowIndex,
            columnName: 'Is Digital target the same than TV?',
            severity: 'critical',
            message: `"Is Digital target the same than TV?" is required because campaign "${campaignName}" has both TV and Digital media in game plans for this country/financial cycle.`,
            currentValue: isDigitalTargetSameAsTv || ''
          });
        }
      } else if (hasDigitalMedia && !hasTvMedia) {
        // Digital-only campaign - "Is Digital target the same than TV?" should be warning if blank
        const isDigitalTargetSameAsTv = record['Is Digital target the same than TV?'];
        if (!isDigitalTargetSameAsTv || isDigitalTargetSameAsTv.toString().trim() === '') {
          issues.push({
            rowIndex,
            columnName: 'Is Digital target the same than TV?',
            severity: 'warning',
            message: `"Is Digital target the same than TV?" should be filled for Digital-only campaigns for consistency.`,
            currentValue: isDigitalTargetSameAsTv || ''
          });
        }
      }

      // Planned Combined Reach validation - required when both TV and Digital planned reach values are present
      const tvPlannedR1Plus = record['Total TV Planned R1+ (%)'];
      const digitalPlannedR1Plus = record['Total Digital Planned R1+'];
      const plannedCombinedReach = record['Planned Combined Reach (Don\'t fill)'];
      
      const hasTvPlannedR1Plus = tvPlannedR1Plus && tvPlannedR1Plus.toString().trim() !== '';
      const hasDigitalPlannedR1Plus = digitalPlannedR1Plus && digitalPlannedR1Plus.toString().trim() !== '';
      const hasPlannedCombinedReach = plannedCombinedReach && plannedCombinedReach.toString().trim() !== '';

      if (hasTvMedia && hasDigitalMedia) {
        // For campaigns with both TV and Digital, combined reach fields should only be filled for mixed campaigns
        if (hasTvPlannedR1Plus && hasDigitalPlannedR1Plus && !hasPlannedCombinedReach) {
          issues.push({
            rowIndex,
            columnName: 'Planned Combined Reach (Don\'t fill)',
            severity: 'critical',
            message: 'Planned Combined Reach (Don\'t fill) is required when both Total TV Planned R1+ (%) and Total Digital Planned R1+ have values.',
            currentValue: plannedCombinedReach || ''
          });
        }
      } else {
        // For single-media campaigns, combined reach fields should be empty
        if (hasPlannedCombinedReach) {
          issues.push({
            rowIndex,
            columnName: 'Planned Combined Reach (Don\'t fill)',
            severity: 'critical',
            message: `Planned Combined Reach (Don't fill) should only be filled for campaigns with both TV and Digital media. Campaign "${campaignName}" only has ${hasTvMedia ? 'TV' : 'Digital'} media.`,
            currentValue: plannedCombinedReach
          });
        }
      }

      // Combined Potential Reach validation - required when both TV and Digital potential reach values are present
      const tvPotentialR1Plus = record['TV Optimal R1+'];
      const digitalPotentialR1Plus = record['Total Digital Optimal R1+'];
      const combinedPotentialReach = record['Combined Potential Reach'];
      
      const hasTvPotentialR1Plus = tvPotentialR1Plus && tvPotentialR1Plus.toString().trim() !== '';
      const hasDigitalPotentialR1Plus = digitalPotentialR1Plus && digitalPotentialR1Plus.toString().trim() !== '';
      const hasCombinedPotentialReach = combinedPotentialReach && combinedPotentialReach.toString().trim() !== '';

      if (hasTvMedia && hasDigitalMedia) {
        // For campaigns with both TV and Digital, combined reach fields should only be filled for mixed campaigns
        if (hasTvPotentialR1Plus && hasDigitalPotentialR1Plus && !hasCombinedPotentialReach) {
          issues.push({
            rowIndex,
            columnName: 'Combined Potential Reach',
            severity: 'critical',
            message: 'Combined Potential Reach is required when both TV Optimal R1+ and Total Digital Optimal R1+ have values.',
            currentValue: combinedPotentialReach || ''
          });
        }
      } else {
        // For single-media campaigns, combined reach fields should be empty
        if (hasCombinedPotentialReach) {
          issues.push({
            rowIndex,
            columnName: 'Combined Potential Reach',
            severity: 'critical',
            message: `Combined Potential Reach should only be filled for campaigns with both TV and Digital media. Campaign "${campaignName}" only has ${hasTvMedia ? 'TV' : 'Digital'} media.`,
            currentValue: combinedPotentialReach
          });
        }
      }

    });

  } catch (error) {
    console.error('Error in cross-reference validation:', error);
    issues.push({
      rowIndex: 0,
      columnName: 'General',
      severity: 'warning',
      message: 'Unable to perform cross-reference validation against game plans. Please check manually.',
      currentValue: ''
    });
  }

  return issues;
}

function isValidNumber(value: any): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  return !isNaN(numValue) && isFinite(numValue);
}

function isValidPercentage(value: any, allowZero: boolean = false): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const strValue = value.toString().trim();
  
  // Only handle percentage with % symbol
  if (strValue.includes('%')) {
    const numValue = parseFloat(strValue.replace('%', ''));
    if (allowZero) {
      return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
    }
    return !isNaN(numValue) && numValue >= 1 && numValue <= 100;
  }
  
  // Reject decimal format (0-1) - only percentage format allowed
  return false;
}

function isValidDate(value: any): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const strValue = value.toString().trim();
  
  // Support multiple date formats
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/ // D-M-YYYY or DD-MM-YYYY
  ];
  
  // Check if format matches
  const formatMatches = dateFormats.some(format => format.test(strValue));
  if (!formatMatches) return false;
  
  // Try to parse the date
  let date: Date;
  if (strValue.includes('/')) {
    // Handle DD/MM/YYYY format
    const parts = strValue.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      date = new Date(year, month, day);
    } else {
      return false;
    }
  } else if (strValue.includes('-')) {
    // Handle DD-MM-YYYY or YYYY-MM-DD format
    const parts = strValue.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        date = new Date(strValue);
      } else {
        // DD-MM-YYYY
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      }
    } else {
      return false;
    }
  } else {
    date = new Date(strValue);
  }
  
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidString(value: any, fieldName?: string): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const strValue = value.toString().trim();
  
  // Special handling for TV Copy Length - allows values like "30\"", "20\" 10\""
  if (fieldName === 'TV Copy Length') {
    // Allow numbers, quotes, spaces for TV copy length (e.g., "30\"", "20\" 10\"")
    return /^[0-9\s\"\\]+$/.test(strValue);
  }
  
  // Check if it's a pure number (which should be invalid for most string fields)
  if (/^\d+(\.\d+)?$/.test(strValue)) {
    return false;
  }
  
  // Must contain at least one letter for most text fields
  if (!/[a-zA-Z]/.test(strValue)) {
    return false;
  }
  
  // Allow letters, numbers, spaces, basic punctuation
  return /^[a-zA-Z0-9\s\-\+\(\)\/\&\.\,]+$/.test(strValue);
}

async function validateRecord(record: any, index: number, masterData?: any): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    const value = record[field];
    if (!value || value.toString().trim() === '') {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} is required`,
        currentValue: value
      });
    }
  });

  // Database relationship validation
  if (masterData) {
    // Validate Country exists in database
    const country = record['Country'];
    if (country && masterData.countries) {
      const countryLower = country.toString().trim().toLowerCase();
      const countryExists = masterData.countries.some(c => c.toLowerCase() === countryLower);
      if (!countryExists) {
        issues.push({
          rowIndex: index,
          columnName: 'Country',
          severity: 'critical',
          message: `Country "${country}" does not exist in the database`,
          currentValue: country
        });
      }
    }

    // Validate Sub Region exists and matches Country
    const subRegion = record['Sub Region'];
    if (subRegion && country) {
      // Case-insensitive check for sub region existence
      const subRegionLower = subRegion.toString().trim().toLowerCase();
      const subRegionExists = masterData.subRegions && masterData.subRegions.some(sr => sr.toLowerCase() === subRegionLower);
      
      if (masterData.subRegions && !subRegionExists) {
        issues.push({
          rowIndex: index,
          columnName: 'Sub Region',
          severity: 'critical',
          message: `Sub Region "${subRegion}" does not exist in the database`,
          currentValue: subRegion
        });
      } else if (masterData.countryToSubRegionMap) {
        const expectedSubRegion = masterData.countryToSubRegionMap[country.toString().trim()];
        // Case-insensitive comparison for sub region matching
        if (expectedSubRegion && expectedSubRegion.toLowerCase() !== subRegion.toString().trim().toLowerCase()) {
          issues.push({
            rowIndex: index,
            columnName: 'Sub Region',
            severity: 'warning',
            message: `Sub Region "${subRegion}" may not match Country "${country}". Expected: "${expectedSubRegion}"`,
            currentValue: subRegion
          });
        }
      }
    }

    // Validate BU exists in database
    const bu = record['BU'];
    if (bu && masterData.businessUnits) {
      const buLower = bu.toString().trim().toLowerCase();
      const buExists = masterData.businessUnits.some(b => b?.toLowerCase() === buLower);
      if (!buExists) {
        issues.push({
          rowIndex: index,
          columnName: 'BU',
          severity: 'critical',
          message: `BU "${bu}" does not exist in the database`,
          currentValue: bu
        });
      }
    }

    // Note: Category, Range, and Campaign validation moved to game plans cross-reference validation
    // This avoids duplication and ensures validation against actual game plan data
    
    // Keep only category-range compatibility validation from master data
    const category = record['Category'];
    const range = record['Range'];
    if (range && category && masterData.categoryToRanges) {
      const validRanges = masterData.categoryToRanges[category.toString().trim()] || [];
      const rangeLower = range.toString().trim().toLowerCase();
      const rangeInCategory = validRanges.some(vr => vr.toLowerCase() === rangeLower);
      if (validRanges.length > 0 && !rangeInCategory) {
        issues.push({
          rowIndex: index,
          columnName: 'Range',
          severity: 'warning',
          message: `Range "${range}" may not be compatible with Category "${category}". Valid ranges: ${validRanges.join(', ')}`,
          currentValue: range
        });
      }
    }

    // Note: Campaign validation moved to cross-reference validation against game plans
    // This ensures campaigns are validated against actual game plans for the country/financial cycle

    // Media validation removed - not part of reach planning template

    // Media Sub Type validation removed - not part of reach planning template
  }
  
  // Validate string fields
  FIELD_VALIDATIONS.stringFields.forEach(field => {
    const value = record[field];
    if (value && !isValidString(value, field)) {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must contain valid text`,
        currentValue: value
      });
    }
  });
  
  // Validate numeric fields
  FIELD_VALIDATIONS.numericFields.forEach(field => {
    const value = record[field];
    if (value && !isValidNumber(value)) {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must be a valid number`,
        currentValue: value
      });
    }
  });
  
  // Validate reach percentage fields (can be 0%-100%)
  FIELD_VALIDATIONS.reachPercentageFields.forEach(field => {
    const value = record[field];
    if (value && !isValidPercentage(value, true)) { // Allow zero
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must be a valid percentage (0%-100%)`,
        currentValue: value
      });
    }
  });
  
  // Validate non-zero percentage fields (must be 1%-100%)
  FIELD_VALIDATIONS.nonZeroPercentageFields.forEach(field => {
    const value = record[field];
    if (value && !isValidPercentage(value, false)) { // Don't allow zero
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must be a valid percentage (1%-100%)`,
        currentValue: value
      });
    }
  });
  
  // Validate date fields
  FIELD_VALIDATIONS.dateFields.forEach(field => {
    const value = record[field];
    if (value && !isValidDate(value)) {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must be a valid date (formats: DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD)`,
        currentValue: value
      });
    }
  });
  
  // Validate enum/choice fields (currently none, reach level fields moved to percentage validation)
  Object.entries(FIELD_VALIDATIONS.reachLevelFields).forEach(([field, allowedValues]) => {
    const value = record[field];
    if (value && value !== '' && !allowedValues.includes(value.toString().trim())) {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'warning',
        message: `${field} should be one of: ${allowedValues.join(', ')}`,
        currentValue: value
      });
    }
  });
  
  // Validate gender fields
  Object.entries(FIELD_VALIDATIONS.genderFields).forEach(([field, allowedValues]) => {
    const value = record[field];
    if (value && value !== '') {
      const normalizedValue = value.toString().trim().toUpperCase();
      if (!allowedValues.includes(normalizedValue)) {
        issues.push({
          rowIndex: index,
          columnName: field,
          severity: 'critical',
          message: `${field} must be one of: ${allowedValues.join(', ')}`,
          currentValue: value
        });
      }
    }
  });
  
  // Validate currency fields
  Object.entries(FIELD_VALIDATIONS.currencyFields).forEach(([field, allowedValues]) => {
    const value = record[field];
    if (value && value !== '') {
      const normalizedValue = value.toString().trim().toUpperCase();
      if (!allowedValues.includes(normalizedValue)) {
        issues.push({
          rowIndex: index,
          columnName: field,
          severity: 'critical',
          message: `${field} must be a valid ISO currency code (e.g., USD, EUR, GBP)`,
          currentValue: value
        });
      }
    }
  });
  
  // Business logic validations
  
  // Date range validation
  const startDate = record['Start Date'];
  const endDate = record['End Date'];
  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      issues.push({
        rowIndex: index,
        columnName: 'End Date',
        severity: 'critical',
        message: 'End Date must be after Start Date',
        currentValue: endDate
      });
    }
  }
  
  // CPP validation (CPP 2025 should generally be >= CPP 2024)
  const cpp2024 = record['CPP 2024'];
  const cpp2025 = record['CPP 2025'];
  if (cpp2024 && cpp2025 && isValidNumber(cpp2024) && isValidNumber(cpp2025)) {
    const cpp24 = parseFloat(cpp2024.toString().replace(/,/g, ''));
    const cpp25 = parseFloat(cpp2025.toString().replace(/,/g, ''));
    if (cpp25 < cpp24 * 0.8) { // Allow some decrease but flag significant drops
      issues.push({
        rowIndex: index,
        columnName: 'CPP 2025',
        severity: 'suggestion',
        message: 'CPP 2025 is significantly lower than CPP 2024, please verify',
        currentValue: cpp2025
      });
    }
  }
  
  // Age validation - minimum age should be lower than maximum age
  const tvMinAge = record['TV Demo Min. Age'];
  const tvMaxAge = record['TV Demo Max. Age'];
  if (tvMinAge && tvMaxAge && isValidNumber(tvMinAge) && isValidNumber(tvMaxAge)) {
    const minAge = parseFloat(tvMinAge.toString());
    const maxAge = parseFloat(tvMaxAge.toString());
    if (minAge >= maxAge) {
      issues.push({
        rowIndex: index,
        columnName: 'TV Demo Max. Age',
        severity: 'critical',
        message: 'TV Demo Max. Age must be greater than TV Demo Min. Age',
        currentValue: tvMaxAge
      });
    }
  }
  
  const digitalMinAge = record['Digital Demo Min. Age'];
  const digitalMaxAge = record['Digital Demo Max. Age'];
  if (digitalMinAge && digitalMaxAge && isValidNumber(digitalMinAge) && isValidNumber(digitalMaxAge)) {
    const minAge = parseFloat(digitalMinAge.toString());
    const maxAge = parseFloat(digitalMaxAge.toString());
    if (minAge >= maxAge) {
      issues.push({
        rowIndex: index,
        columnName: 'Digital Demo Max. Age',
        severity: 'critical',
        message: 'Digital Demo Max. Age must be greater than Digital Demo Min. Age',
        currentValue: digitalMaxAge
      });
    }
  }
  
  // Digital target matching validation - when "Is Digital target the same than TV?" is Yes
  const isDigitalTargetSameAsTv = record['Is Digital target the same than TV?'];
  if (isDigitalTargetSameAsTv) {
    const sameAsTV = isDigitalTargetSameAsTv.toString().toLowerCase() === 'yes' ||
                     isDigitalTargetSameAsTv.toString().toLowerCase() === 'y' ||
                     isDigitalTargetSameAsTv.toString().toLowerCase() === 'true';
    
    if (sameAsTV) {
      // Check TV Demo Gender vs Digital Demo Gender
      const tvGender = record['TV Demo Gender'];
      const digitalGender = record['Digital Demo Gender'];
      if (tvGender && digitalGender && tvGender.toString().trim().toUpperCase() !== digitalGender.toString().trim().toUpperCase()) {
        issues.push({
          rowIndex: index,
          columnName: 'Digital Demo Gender',
          severity: 'critical',
          message: 'Digital Demo Gender must match TV Demo Gender when digital target is the same as TV target',
          currentValue: digitalGender
        });
      }
      
      // Check TV Demo Min. Age vs Digital Demo Min. Age
      if (tvMinAge && digitalMinAge && tvMinAge.toString().trim() !== digitalMinAge.toString().trim()) {
        issues.push({
          rowIndex: index,
          columnName: 'Digital Demo Min. Age',
          severity: 'critical',
          message: 'Digital Demo Min. Age must match TV Demo Min. Age when digital target is the same as TV target',
          currentValue: digitalMinAge
        });
      }
      
      // Check TV Demo Max. Age vs Digital Demo Max. Age
      if (tvMaxAge && digitalMaxAge && tvMaxAge.toString().trim() !== digitalMaxAge.toString().trim()) {
        issues.push({
          rowIndex: index,
          columnName: 'Digital Demo Max. Age',
          severity: 'critical',
          message: 'Digital Demo Max. Age must match TV Demo Max. Age when digital target is the same as TV target',
          currentValue: digitalMaxAge
        });
      }
      
      // Check TV SEL vs Digital SEL
      const tvSel = record['TV SEL'];
      const digitalSel = record['Digital SEL'];
      if (tvSel && digitalSel && tvSel.toString().trim() !== digitalSel.toString().trim()) {
        issues.push({
          rowIndex: index,
          columnName: 'Digital SEL',
          severity: 'critical',
          message: 'Digital SEL must match TV SEL when digital target is the same as TV target',
          currentValue: digitalSel
        });
      }
    }
  }
  
  // Final TV Target format validation
  const finalTvTarget = record['Final TV Target (don\'t fill)'];
  
  if (finalTvTarget && finalTvTarget.toString().trim() !== '') {
    const finalTvTargetStr = finalTvTarget.toString().trim();
    
    if (isDigitalTargetSameAsTv) {
      const sameAsTV = isDigitalTargetSameAsTv.toString().toLowerCase() === 'yes' ||
                       isDigitalTargetSameAsTv.toString().toLowerCase() === 'y' ||
                       isDigitalTargetSameAsTv.toString().toLowerCase() === 'true';
      
      if (!sameAsTV) {
        // Digital target is different from TV - Final TV Target should be based on TV demographics: "Gender MinAge - MaxAge SEL"
        const tvGender = record['TV Demo Gender'];
        const tvMinAge = record['TV Demo Min. Age'];
        const tvMaxAge = record['TV Demo Max. Age'];
        const tvSel = record['TV SEL'];
        
        if (tvGender && tvMinAge && tvMaxAge && tvSel) {
          const expectedFormat = `${tvGender.toString().trim()} ${tvMinAge.toString().trim()} - ${tvMaxAge.toString().trim()} ${tvSel.toString().trim()}`;
          
          if (finalTvTargetStr !== expectedFormat) {
            issues.push({
              rowIndex: index,
              columnName: 'Final TV Target (don\'t fill)',
              severity: 'critical',
              message: `Final TV Target format should be "${expectedFormat}" based on TV demographics when digital target is different from TV target`,
              currentValue: finalTvTarget
            });
          }
        } else {
          // Missing TV demographic fields - can't validate format
          issues.push({
            rowIndex: index,
            columnName: 'Final TV Target (don\'t fill)',
            severity: 'warning',
            message: 'Cannot validate Final TV Target format - missing TV demographic fields (Gender, Min Age, Max Age, SEL)',
            currentValue: finalTvTarget
          });
        }
      } else {
        // Digital target is same as TV - validate format matches TV demographics: "Gender MinAge - MaxAge SEL"
        const tvGender = record['TV Demo Gender'];
        const tvMinAge = record['TV Demo Min. Age'];
        const tvMaxAge = record['TV Demo Max. Age'];
        const tvSel = record['TV SEL'];
        
        if (tvGender && tvMinAge && tvMaxAge && tvSel) {
          const expectedFormat = `${tvGender.toString().trim()} ${tvMinAge.toString().trim()} - ${tvMaxAge.toString().trim()} ${tvSel.toString().trim()}`;
          
          if (finalTvTargetStr !== expectedFormat) {
            issues.push({
              rowIndex: index,
              columnName: 'Final TV Target (don\'t fill)',
              severity: 'critical',
              message: `Final TV Target format should be "${expectedFormat}" when digital target is same as TV target`,
              currentValue: finalTvTarget
            });
          }
        } else {
          // Missing TV demographic fields - can't validate format
          issues.push({
            rowIndex: index,
            columnName: 'Final TV Target (don\'t fill)',
            severity: 'warning',
            message: 'Cannot validate Final TV Target format - missing TV demographic fields (Gender, Min Age, Max Age, SEL)',
            currentValue: finalTvTarget
          });
        }
      }
    }
  }
  
  // CPP and Reported Currency validation
  const cpp2026 = record['CPP 2026'];
  const reportedCurrency = record['Reported Currency'];
  
  const hasCppValue = (cpp2024 && cpp2024.toString().trim() !== '') ||
                      (cpp2025 && cpp2025.toString().trim() !== '') ||
                      (cpp2026 && cpp2026.toString().trim() !== '');
  
  if (hasCppValue && (!reportedCurrency || reportedCurrency.toString().trim() === '')) {
    issues.push({
      rowIndex: index,
      columnName: 'Reported Currency',
      severity: 'critical',
      message: 'Reported Currency is required when CPP values are provided',
      currentValue: reportedCurrency || ''
    });
  }
  
  // Media and Media Sub Type compatibility (basic check)
  const media = record['Media'];
  const mediaSubType = record['Media Sub Type'];
  if (media && mediaSubType) {
    const tvSubTypes = ['Linear TV', 'Connected TV', 'Paid TV'];
    const digitalSubTypes = ['Social Media', 'Search', 'Display', 'Video', 'Programmatic'];
    
    if (media === 'TV' && digitalSubTypes.includes(mediaSubType)) {
      issues.push({
        rowIndex: index,
        columnName: 'Media Sub Type',
        severity: 'warning',
        message: `Media Sub Type "${mediaSubType}" may not be compatible with Media type "TV"`,
        currentValue: mediaSubType
      });
    }
    
    if (media === 'Digital' && tvSubTypes.includes(mediaSubType)) {
      issues.push({
        rowIndex: index,
        columnName: 'Media Sub Type',
        severity: 'warning',
        message: `Media Sub Type "${mediaSubType}" may not be compatible with Media type "Digital"`,
        currentValue: mediaSubType
      });
    }
  }
  
  return issues;
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/reach-planning/validate');
  
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Validate session ID format
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    console.log(`Validating session: ${sessionId}`);
    
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    const records = sessionData.records || [];
    
    console.log(`Validating ${records.length} records`);
    
    // Load master data from JSON file (same as game plans validation) and supplement with database
    console.log('Loading master data from masterData.json and database...');
    let masterData: any = null;
    try {
      // Load the updated master data from JSON file
      const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
      const masterDataJson = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
      
      // Also fetch database data for cross-reference validation
      const [
        countries,
        subRegions,
        categories,
        ranges,
        categoryToRangeRelations,
        mediaTypes,
        mediaSubTypes,
        campaigns,
        businessUnits
      ] = await Promise.all([
        prisma.country.findMany({
          include: {
            subRegion: true
          }
        }),
        prisma.subRegion.findMany(),
        prisma.category.findMany(),
        prisma.range.findMany(),
        prisma.categoryToRange.findMany({
          include: {
            category: true,
            range: true
          }
        }),
        prisma.mediaType.findMany(),
        prisma.mediaSubType.findMany({
          include: {
            mediaType: true
          }
        }),
        prisma.campaign.findMany({
          include: {
            range: true
          }
        }),
        prisma.businessUnit.findMany()
      ]);

      // Build master data mappings using JSON file as primary source
      const countryToSubRegionMap: Record<string, string> = {};
      countries.forEach(country => {
        if (country.subRegion) {
          countryToSubRegionMap[country.name] = country.subRegion.name;
        }
      });

      // Use updated mappings from JSON file for category-range and campaign-range relationships
      const categoryToRanges = masterDataJson.categoryToRanges || {};
      const campaignToRangeMap = masterDataJson.campaignToRangeMap || {};

      const mediaToSubtypes: Record<string, string[]> = {};
      mediaSubTypes.forEach(subType => {
        if (subType.mediaType) {
          const mediaTypeName = subType.mediaType.name;
          if (!mediaToSubtypes[mediaTypeName]) {
            mediaToSubtypes[mediaTypeName] = [];
          }
          if (!mediaToSubtypes[mediaTypeName].includes(subType.name)) {
            mediaToSubtypes[mediaTypeName].push(subType.name);
          }
        }
      });

      masterData = {
        // Use JSON file data for categories, ranges, campaigns (updated mappings)
        countries: countries.map(c => c.name),
        subRegions: subRegions.map(sr => sr.name),
        categories: masterDataJson.categories || categories.map(c => c.name),
        ranges: masterDataJson.ranges || ranges.map(r => r.name),
        campaigns: masterDataJson.campaigns || campaigns.map(c => c.name),
        mediaTypes: mediaTypes.map(mt => mt.name),
        mediaSubTypes: mediaSubTypes.map(mst => mst.name),
        businessUnits: masterDataJson.businessUnits || businessUnits.map(bu => bu.name).filter(name => name),
        // Use updated mappings from JSON file
        countryToSubRegionMap,
        categoryToRanges,
        campaignToRangeMap,
        mediaToSubtypes
      };

      console.log(`Master data loaded: ${countries.length} countries, ${campaigns.length} campaigns, ${mediaTypes.length} media types`);
      console.log(`Campaigns from JSON: ${masterDataJson.campaigns ? masterDataJson.campaigns.length : 'undefined'}`);
      console.log(`Final campaigns array: ${masterData.campaigns ? masterData.campaigns.length : 'undefined'}`);
      console.log(`Sample campaigns:`, masterData.campaigns ? masterData.campaigns.slice(0, 10) : 'none');
    } catch (error) {
      console.error('Failed to fetch master data:', error);
      // Continue validation without database relationship checks
    }
    
    // Perform standard validation
    let allIssues: ValidationIssue[] = [];
    
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const recordIssues = await validateRecord(record, index, masterData);
      allIssues = allIssues.concat(recordIssues);
    }

    // Add cross-reference validation against game plans with timeout
    if (sessionData.countryId && sessionData.lastUpdateId) {
      console.log(`Performing cross-reference validation for countryId: ${sessionData.countryId}, lastUpdateId: ${sessionData.lastUpdateId}`);
      try {
        // Add timeout to prevent hanging
        const validationPromise = validateAgainstGamePlans(records, sessionData.countryId, sessionData.lastUpdateId);
        const timeoutPromise = new Promise<ValidationIssue[]>((_, reject) => 
          setTimeout(() => reject(new Error('Game plan validation timeout')), 30000) // 30 second timeout
        );
        
        const gameplanValidationIssues = await Promise.race([validationPromise, timeoutPromise]);
        allIssues = allIssues.concat(gameplanValidationIssues);
        console.log(`Cross-reference validation found ${gameplanValidationIssues.length} additional issues`);
      } catch (error) {
        console.error('Cross-reference validation failed:', error);
        // Add a warning issue instead of failing the entire validation
        allIssues.push({
          rowIndex: 0,
          columnName: 'General',
          severity: 'warning',
          message: 'Cross-reference validation against game plans failed. Please verify data manually.',
          currentValue: ''
        });
      }
    } else {
      console.log('Skipping cross-reference validation - missing countryId or lastUpdateId in session data');
    }
    
    // Create validation summary
    const summary = {
      total: allIssues.length,
      critical: allIssues.filter(i => i.severity === 'critical').length,
      warning: allIssues.filter(i => i.severity === 'warning').length,
      suggestion: allIssues.filter(i => i.severity === 'suggestion').length,
      uniqueRows: new Set(allIssues.map(i => i.rowIndex)).size
    };
    
    // Update session with validation results
    sessionData.validationIssues = allIssues;
    sessionData.validationSummary = summary;
    sessionData.status = 'validated';
    sessionData.validatedAt = new Date().toISOString();
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    
    console.log(`Validation completed: ${allIssues.length} issues found`);
    
    return NextResponse.json({
      success: true,
      sessionId,
      summary,
      issues: allIssues.slice(0, 100), // Return first 100 issues for display
      fieldMapping: FIELD_MAPPING,
      canImport: summary.critical === 0
    });
    
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json({
      error: 'Failed to validate session',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}