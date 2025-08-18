import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidatedRecord {
  category?: any;
  range?: any;
  campaign?: any;
  country?: any;
  businessUnit?: any;
  mediaType?: any;
  mediaSubType?: any;
  validationResult: ValidationResult;
}

export class ValidationUtility {
  // Cache for database lookups
  private countryCache = new Map<string, any>();
  private businessUnitCache = new Map<string, any>();
  private categoryCache = new Map<string, any>();
  private rangeCache = new Map<string, any>();
  private campaignCache = new Map<string, any>();
  private mediaTypeCache = new Map<string, any>();
  private mediaSubTypeCache = new Map<string, any>();
  private campaignToRangeMap = new Map<string, string[]>();

  async initialize() {
    console.log('🔄 Initializing validation utility...');
    
    // Load campaign to range mappings from junction table
    const junctionData = await prisma.rangeToCampaign.findMany({
      include: {
        range: true,
        campaign: true
      }
    });

    junctionData.forEach(junction => {
      if (junction.campaign && junction.range) {
        const campaignName = junction.campaign.name;
        if (!this.campaignToRangeMap.has(campaignName)) {
          this.campaignToRangeMap.set(campaignName, []);
        }
        this.campaignToRangeMap.get(campaignName)!.push(junction.range.name);
      }
    });

    console.log(`✅ Loaded ${this.campaignToRangeMap.size} campaign mappings from junction table`);
  }

  async validateRecord(
    categoryName: string | null,
    rangeName: string | null,
    campaignName: string | null,
    countryName: string | null,
    businessUnitName: string | null,
    mediaTypeName?: string | null,
    mediaSubTypeName?: string | null
  ): Promise<ValidatedRecord> {
    const result: ValidatedRecord = {
      validationResult: {
        isValid: true,
        errors: [],
        warnings: []
      }
    };

    // Validate Country
    if (countryName && countryName !== 'N/A') {
      result.country = await this.findCountry(countryName);
      if (!result.country) {
        result.validationResult.errors.push(`Country "${countryName}" not found in database`);
        result.validationResult.isValid = false;
      }
    }

    // Validate Business Unit
    if (businessUnitName && businessUnitName !== 'N/A') {
      result.businessUnit = await this.findBusinessUnit(businessUnitName);
      if (!result.businessUnit) {
        result.validationResult.errors.push(`Business Unit "${businessUnitName}" not found in database`);
        result.validationResult.isValid = false;
      }
    }

    // Validate Category
    if (categoryName && categoryName !== 'N/A') {
      result.category = await this.findCategory(categoryName, result.businessUnit?.id);
      if (!result.category) {
        result.validationResult.errors.push(`Category "${categoryName}" not found in database`);
        result.validationResult.isValid = false;
      }
    }

    // Validate Range
    if (rangeName && rangeName !== 'N/A') {
      result.range = await this.findRange(rangeName);
      if (!result.range) {
        result.validationResult.errors.push(`Range "${rangeName}" not found in database`);
        result.validationResult.isValid = false;
      }
    }

    // Validate Campaign and Campaign-Range relationship
    if (campaignName && campaignName !== 'N/A') {
      result.campaign = await this.findCampaign(campaignName);
      if (!result.campaign) {
        result.validationResult.errors.push(`Campaign "${campaignName}" not found in database`);
        result.validationResult.isValid = false;
      } else if (rangeName && rangeName !== 'N/A') {
        // Check if campaign is mapped to this range in junction table
        const validRanges = this.campaignToRangeMap.get(campaignName) || [];
        if (!validRanges.includes(rangeName)) {
          result.validationResult.errors.push(
            `Campaign "${campaignName}" is not mapped to range "${rangeName}". Valid ranges: [${validRanges.join(', ')}]`
          );
          result.validationResult.isValid = false;
        }
      }
    }

    // Validate Media Type
    if (mediaTypeName && mediaTypeName !== 'N/A') {
      result.mediaType = await this.findMediaType(mediaTypeName);
      if (!result.mediaType) {
        result.validationResult.warnings.push(`Media Type "${mediaTypeName}" not found in database`);
      }
    }

    // Validate Media Sub Type
    if (mediaSubTypeName && mediaSubTypeName !== 'N/A') {
      result.mediaSubType = await this.findMediaSubType(mediaSubTypeName, result.mediaType?.id);
      if (!result.mediaSubType) {
        result.validationResult.warnings.push(`Media SubType "${mediaSubTypeName}" not found in database`);
      }
    }

    return result;
  }

  private async findCountry(name: string) {
    if (this.countryCache.has(name)) {
      return this.countryCache.get(name);
    }
    
    const country = await prisma.country.findFirst({
      where: { name }
    });
    
    this.countryCache.set(name, country);
    return country;
  }

  private async findBusinessUnit(name: string) {
    if (this.businessUnitCache.has(name)) {
      return this.businessUnitCache.get(name);
    }
    
    const businessUnit = await prisma.businessUnit.findFirst({
      where: { name }
    });
    
    this.businessUnitCache.set(name, businessUnit);
    return businessUnit;
  }

  private async findCategory(name: string, businessUnitId?: number) {
    const cacheKey = `${name}_${businessUnitId || 'null'}`;
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey);
    }
    
    let category = null;
    if (businessUnitId) {
      category = await prisma.category.findFirst({
        where: { 
          name,
          businessUnitId
        }
      });
    }
    
    // Try without businessUnitId if not found
    if (!category) {
      category = await prisma.category.findFirst({
        where: { name }
      });
    }
    
    this.categoryCache.set(cacheKey, category);
    return category;
  }

  private async findRange(name: string) {
    if (this.rangeCache.has(name)) {
      return this.rangeCache.get(name);
    }
    
    const range = await prisma.range.findFirst({
      where: { name }
    });
    
    this.rangeCache.set(name, range);
    return range;
  }

  private async findCampaign(name: string) {
    if (this.campaignCache.has(name)) {
      return this.campaignCache.get(name);
    }
    
    const campaign = await prisma.campaign.findFirst({
      where: { name }
    });
    
    this.campaignCache.set(name, campaign);
    return campaign;
  }

  private async findMediaType(name: string) {
    if (this.mediaTypeCache.has(name)) {
      return this.mediaTypeCache.get(name);
    }
    
    const mediaType = await prisma.mediaType.findFirst({
      where: { name }
    });
    
    this.mediaTypeCache.set(name, mediaType);
    return mediaType;
  }

  private async findMediaSubType(name: string, mediaTypeId?: number) {
    const cacheKey = `${name}_${mediaTypeId || 'null'}`;
    if (this.mediaSubTypeCache.has(cacheKey)) {
      return this.mediaSubTypeCache.get(cacheKey);
    }
    
    let mediaSubType = null;
    if (mediaTypeId) {
      mediaSubType = await prisma.mediaSubType.findFirst({
        where: { 
          name,
          mediaTypeId
        }
      });
    }
    
    // Try without mediaTypeId if not found
    if (!mediaSubType) {
      mediaSubType = await prisma.mediaSubType.findFirst({
        where: { name }
      });
    }
    
    this.mediaSubTypeCache.set(cacheKey, mediaSubType);
    return mediaSubType;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}