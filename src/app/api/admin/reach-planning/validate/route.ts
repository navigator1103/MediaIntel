import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Field mapping for MediaSufficiency table
const FIELD_MAPPING = {
  'Last Update': 'lastUpdate',
  'Sub Region': 'subRegion', 
  'Country': 'country',
  'BU': 'bu',
  'Category': 'category',
  'Range': 'range',
  'Campaign': 'campaign',
  'Franchise NS': 'franchiseNs',
  'Campaign Socio-Demo Target': 'campaignSocioDemoTarget',
  'Total Country Population On Target': 'totalCountryPopulationOnTarget',
  'TV Copy Length': 'tvCopyLength',
  'TV Target Size': 'tvTargetSize',
  'WOA Open TV': 'woaOpenTv',
  'WOA Paid TV': 'woaPaidTv',
  'Total TRPs': 'totalTrps',
  'TV R1+': 'tvR1Plus',
  'TV R3+': 'tvR3Plus',
  'TV Ideal Reach': 'tvIdealReach',
  'CPP 2024': 'cpp2024',
  'CPP 2025': 'cpp2025',
  'Digital Target': 'digitalTarget',
  'Digital Target Size': 'digitalTargetSize',
  'WOA PM FF': 'woaPmFf',
  'WOA Influencers Amplification': 'woaInfluencersAmplification',
  'Digital R1+': 'digitalR1Plus',
  'Digital R3+': 'digitalR3Plus',
  'Digital Ideal Reach': 'digitalIdealReach',
  'Planned Combined Reach': 'plannedCombinedReach',
  'Combined Ideal Reach': 'combinedIdealReach',
  'Digital Reach Level Check': 'digitalReachLevelCheck',
  'TV Reach Level Check': 'tvReachLevelCheck',
  'Combined Reach Level Check': 'combinedReachLevelCheck',
  'Start Date': 'startDate',
  'End Date': 'endDate',
  'Media': 'media',
  'Media Sub Type': 'mediaSubType'
};

// Required fields for validation
const REQUIRED_FIELDS = [
  'Last Update',
  'Sub Region',
  'Country', 
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
    'Last Update', 'Sub Region', 'Country', 'BU', 'Category', 'Range', 'Campaign',
    'Franchise NS', 'Campaign Socio-Demo Target', 'TV Copy Length', 'Digital Target',
    'Digital Reach Level Check', 'TV Reach Level Check', 'Combined Reach Level Check',
    'Media', 'Media Sub Type'
  ],
  
  // Numeric fields - should be valid numbers (can include commas)
  numericFields: [
    'Total Country Population On Target', 'TV Target Size', 'WOA Open TV', 'WOA Paid TV', 
    'Total TRPs', 'CPP 2024', 'CPP 2025', 'Digital Target Size', 'WOA PM FF', 'WOA Influencers Amplification'
  ],
  
  // Percentage fields - should be 0-100% or 0-1 decimal
  percentageFields: [
    'TV R1+', 'TV R3+', 'TV Ideal Reach', 'Digital R1+', 'Digital R3+', 'Digital Ideal Reach',
    'Planned Combined Reach', 'Combined Ideal Reach'
  ],
  
  // Date fields - should be valid dates
  dateFields: ['Start Date', 'End Date'],
  
  // Enum/Choice fields with allowed values
  reachLevelFields: {
    'Digital Reach Level Check': ['Sufficient', 'Moderate', 'Low', 'Insufficient'],
    'TV Reach Level Check': ['Sufficient', 'Moderate', 'Low', 'Insufficient'],
    'Combined Reach Level Check': ['Sufficient', 'Moderate', 'Low', 'Insufficient']
  }
};

function isValidNumber(value: any): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  return !isNaN(numValue) && isFinite(numValue);
}

function isValidPercentage(value: any): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const strValue = value.toString().trim();
  
  // Handle percentage with % symbol
  if (strValue.includes('%')) {
    const numValue = parseFloat(strValue.replace('%', ''));
    return !isNaN(numValue) && numValue >= 0 && numValue <= 100;
  }
  
  // Handle decimal percentage (0-1)
  const numValue = parseFloat(strValue);
  return !isNaN(numValue) && numValue >= 0 && numValue <= 1;
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

function isValidString(value: any): boolean {
  if (!value || value === '') return true; // Empty is allowed for optional fields
  const strValue = value.toString().trim();
  
  // Check if it's a pure number (which should be invalid for string fields)
  if (/^\d+(\.\d+)?$/.test(strValue)) {
    return false;
  }
  
  // Must contain at least one letter for text fields
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
    if (country && masterData.countries && !masterData.countries.includes(country.toString().trim())) {
      issues.push({
        rowIndex: index,
        columnName: 'Country',
        severity: 'critical',
        message: `Country "${country}" does not exist in the database`,
        currentValue: country
      });
    }

    // Validate Sub Region exists and matches Country
    const subRegion = record['Sub Region'];
    if (subRegion && country) {
      if (masterData.subRegions && !masterData.subRegions.includes(subRegion.toString().trim())) {
        issues.push({
          rowIndex: index,
          columnName: 'Sub Region',
          severity: 'critical',
          message: `Sub Region "${subRegion}" does not exist in the database`,
          currentValue: subRegion
        });
      } else if (masterData.countryToSubRegionMap) {
        const expectedSubRegion = masterData.countryToSubRegionMap[country.toString().trim()];
        if (expectedSubRegion && expectedSubRegion !== subRegion.toString().trim()) {
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

    // Validate Category exists in database
    const category = record['Category'];
    if (category && masterData.categories && !masterData.categories.includes(category.toString().trim())) {
      issues.push({
        rowIndex: index,
        columnName: 'Category',
        severity: 'critical',
        message: `Category "${category}" does not exist in the database`,
        currentValue: category
      });
    }

    // Validate Range exists and is compatible with Category
    const range = record['Range'];
    if (range && category) {
      if (masterData.ranges && !masterData.ranges.includes(range.toString().trim())) {
        issues.push({
          rowIndex: index,
          columnName: 'Range',
          severity: 'critical',
          message: `Range "${range}" does not exist in the database`,
          currentValue: range
        });
      } else if (masterData.categoryToRanges) {
        const validRanges = masterData.categoryToRanges[category.toString().trim()] || [];
        if (validRanges.length > 0 && !validRanges.includes(range.toString().trim())) {
          issues.push({
            rowIndex: index,
            columnName: 'Range',
            severity: 'warning',
            message: `Range "${range}" may not be compatible with Category "${category}". Valid ranges: ${validRanges.join(', ')}`,
            currentValue: range
          });
        }
      }
    }

    // Validate Campaign exists and is compatible with Range
    const campaign = record['Campaign'];
    if (campaign && range) {
      if (masterData.campaigns && !masterData.campaigns.includes(campaign.toString().trim())) {
        issues.push({
          rowIndex: index,
          columnName: 'Campaign',
          severity: 'critical',
          message: `Campaign "${campaign}" does not exist in the database`,
          currentValue: campaign
        });
      } else if (masterData.campaignToRangeMap) {
        const expectedRange = masterData.campaignToRangeMap[campaign.toString().trim()];
        if (expectedRange && expectedRange !== range.toString().trim()) {
          issues.push({
            rowIndex: index,
            columnName: 'Campaign',
            severity: 'warning',
            message: `Campaign "${campaign}" may not be compatible with Range "${range}". Expected range: "${expectedRange}"`,
            currentValue: campaign
          });
        }
      }
    }

    // Validate Media Type exists in database
    const media = record['Media'];
    if (media && masterData.mediaTypes && !masterData.mediaTypes.includes(media.toString().trim())) {
      issues.push({
        rowIndex: index,
        columnName: 'Media',
        severity: 'critical',
        message: `Media type "${media}" does not exist in the database`,
        currentValue: media
      });
    }

    // Validate Media Sub Type exists and is compatible with Media Type
    const mediaSubType = record['Media Sub Type'];
    if (mediaSubType && media) {
      if (masterData.mediaSubTypes && !masterData.mediaSubTypes.includes(mediaSubType.toString().trim())) {
        issues.push({
          rowIndex: index,
          columnName: 'Media Sub Type',
          severity: 'critical',
          message: `Media Sub Type "${mediaSubType}" does not exist in the database`,
          currentValue: mediaSubType
        });
      } else if (masterData.mediaToSubtypes) {
        const validSubTypes = masterData.mediaToSubtypes[media.toString().trim()] || [];
        if (validSubTypes.length > 0 && !validSubTypes.includes(mediaSubType.toString().trim())) {
          issues.push({
            rowIndex: index,
            columnName: 'Media Sub Type',
            severity: 'warning',
            message: `Media Sub Type "${mediaSubType}" may not be compatible with Media type "${media}". Valid sub types: ${validSubTypes.join(', ')}`,
            currentValue: mediaSubType
          });
        }
      }
    }
  }
  
  // Validate string fields
  FIELD_VALIDATIONS.stringFields.forEach(field => {
    const value = record[field];
    if (value && !isValidString(value)) {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must contain text, not just numbers`,
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
  
  // Validate percentage fields
  FIELD_VALIDATIONS.percentageFields.forEach(field => {
    const value = record[field];
    if (value && !isValidPercentage(value)) {
      issues.push({
        rowIndex: index,
        columnName: field,
        severity: 'critical',
        message: `${field} must be a valid percentage (0-100% or 0-1)`,
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
  
  // Validate enum/choice fields
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
    
    // Fetch master data from database for relationship validation
    console.log('Fetching master data from database...');
    let masterData: any = null;
    try {
      const [
        countries,
        subRegions,
        categories,
        ranges,
        categoryToRangeRelations,
        mediaTypes,
        mediaSubTypes,
        campaigns
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
        })
      ]);

      // Build master data mappings
      const countryToSubRegionMap: Record<string, string> = {};
      countries.forEach(country => {
        if (country.subRegion) {
          countryToSubRegionMap[country.name] = country.subRegion.name;
        }
      });

      const categoryToRanges: Record<string, string[]> = {};
      categoryToRangeRelations.forEach(relation => {
        const categoryName = relation.category.name;
        const rangeName = relation.range.name;
        
        if (!categoryToRanges[categoryName]) {
          categoryToRanges[categoryName] = [];
        }
        if (!categoryToRanges[categoryName].includes(rangeName)) {
          categoryToRanges[categoryName].push(rangeName);
        }
      });

      const campaignToRangeMap: Record<string, string> = {};
      campaigns.forEach(campaign => {
        if (campaign.range) {
          campaignToRangeMap[campaign.name] = campaign.range.name;
        }
      });

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
        countries: countries.map(c => c.name),
        subRegions: subRegions.map(sr => sr.name),
        categories: categories.map(c => c.name),
        ranges: ranges.map(r => r.name),
        campaigns: campaigns.map(c => c.name),
        mediaTypes: mediaTypes.map(mt => mt.name),
        mediaSubTypes: mediaSubTypes.map(mst => mst.name),
        countryToSubRegionMap,
        categoryToRanges,
        campaignToRangeMap,
        mediaToSubtypes
      };

      console.log(`Master data loaded: ${countries.length} countries, ${campaigns.length} campaigns, ${mediaTypes.length} media types`);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
      // Continue validation without database relationship checks
    }
    
    // Perform validation
    let allIssues: ValidationIssue[] = [];
    
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const recordIssues = await validateRecord(record, index, masterData);
      allIssues = allIssues.concat(recordIssues);
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