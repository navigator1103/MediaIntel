import { PrismaClient } from '@prisma/client';
import { MediaSufficiencyValidator } from './mediaSufficiencyValidator';

const prisma = new PrismaClient();

export interface AutoCreateResult {
  campaign?: {
    id: number;
    name: string;
    created: boolean;
  };
  range?: {
    id: number;
    name: string;
    created: boolean;
  };
}

export class AutoCreateValidator extends MediaSufficiencyValidator {
  private autoCreatedEntities: Set<string> = new Set();
  private createdInSession: AutoCreateResult[] = [];

  async validateOrCreateCampaign(campaignName: string, importSource?: string): Promise<{ id: number; name: string; created: boolean }> {
    const cleanName = campaignName.toString().trim();
    
    // First check if campaign exists - use toLowerCase() instead of mode: 'insensitive'
    const cleanNameLower = cleanName.toLowerCase();
    let campaigns = await prisma.campaign.findMany({
      where: { 
        status: { not: 'archived' } // Don't use archived campaigns
      }
    });
    
    // Filter manually for case-insensitive match
    const campaign = campaigns.find(c => c.name.toLowerCase() === cleanNameLower);
    
    if (campaign) {
      return { id: campaign.id, name: campaign.name, created: false };
    }
    
    // Check if we already auto-created this in the current session
    const sessionKey = `campaign:${cleanName.toLowerCase()}`;
    if (this.autoCreatedEntities.has(sessionKey)) {
      const existing = this.createdInSession.find(r => 
        r.campaign?.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existing?.campaign) {
        return existing.campaign;
      }
    }
    
    // Auto-create campaign with pending status
    const newCampaign = await prisma.campaign.create({
      data: {
        name: cleanName,
        status: 'pending_review',
        createdBy: 'import_auto',
        originalName: cleanName,
        notes: `Auto-created during import${importSource ? ` from ${importSource}` : ''} on ${new Date().toISOString()}`
      }
    });
    
    // Track the creation
    this.autoCreatedEntities.add(sessionKey);
    const result = { id: newCampaign.id, name: newCampaign.name, created: true };
    this.createdInSession.push({ campaign: result });
    
    console.log(`🆕 Auto-created campaign: "${cleanName}" (ID: ${newCampaign.id})`);
    
    return result;
  }

  async validateOrCreateRange(rangeName: string, importSource?: string, categoryName?: string): Promise<{ id: number; name: string; created: boolean }> {
    const cleanName = rangeName.toString().trim();
    
    // First check if range exists - use toLowerCase() instead of mode: 'insensitive'
    const cleanNameLower = cleanName.toLowerCase();
    let ranges = await prisma.range.findMany({
      where: { 
        status: { not: 'archived' } // Don't use archived ranges
      }
    });
    
    // Filter manually for case-insensitive match
    const range = ranges.find(r => r.name.toLowerCase() === cleanNameLower);
    
    if (range) {
      return { id: range.id, name: range.name, created: false };
    }
    
    // Check if we already auto-created this in the current session
    const sessionKey = `range:${cleanName.toLowerCase()}`;
    if (this.autoCreatedEntities.has(sessionKey)) {
      const existing = this.createdInSession.find(r => 
        r.range?.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existing?.range) {
        return existing.range;
      }
    }
    
    // Auto-create range with pending status
    const newRange = await prisma.range.create({
      data: {
        name: cleanName,
        status: 'pending_review',
        createdBy: 'import_auto',
        originalName: cleanName,
        notes: `Auto-created during import${importSource ? ` from ${importSource}` : ''} on ${new Date().toISOString()}`
      }
    });
    
    // If categoryName is provided, link the range to the category
    if (categoryName) {
      try {
        // Find the category
        const category = await prisma.category.findFirst({
          where: {
            name: {
              equals: categoryName,
              mode: 'insensitive'
            }
          }
        });
        
        if (category) {
          // Create the CategoryToRange relationship if it doesn't exist
          await prisma.categoryToRange.upsert({
            where: {
              categoryId_rangeId: {
                categoryId: category.id,
                rangeId: newRange.id
              }
            },
            update: {}, // No update needed if it exists
            create: {
              categoryId: category.id,
              rangeId: newRange.id
            }
          });
          
          console.log(`🔗 Linked range "${cleanName}" to category "${categoryName}"`);
        } else {
          console.warn(`⚠️ Could not find category "${categoryName}" to link with range "${cleanName}"`);
        }
      } catch (error) {
        console.error(`❌ Error linking range "${cleanName}" to category "${categoryName}":`, error);
      }
    }
    
    // Track the creation
    this.autoCreatedEntities.add(sessionKey);
    const result = { id: newRange.id, name: newRange.name, created: true };
    this.createdInSession.push({ range: result });
    
    console.log(`🆕 Auto-created range: "${cleanName}" (ID: ${newRange.id})`);
    
    return result;
  }

  // Override the campaign validation rule to use auto-creation
  protected setupValidationRules(): void {
    super.setupValidationRules();
    
    // Remove the existing campaign, range, and cross-reference validation rules
    this.rules = this.rules.filter(rule => 
      !(rule.field === 'Campaign' && rule.type === 'relationship') &&
      !(rule.field === 'Range' && rule.type === 'relationship') &&
      !(rule.field === 'Range' && rule.type === 'cross_reference') &&
      !(rule.field === 'Campaign' && rule.type === 'cross_reference') &&
      !(rule.field === 'Category' && rule.type === 'cross_reference')
    );
    
    // Add new auto-creating validation rules
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning since we auto-create
      message: 'Campaign will be auto-created for review',
      validate: (value, record, allRecords, masterData) => {
        // Always return true since we'll auto-create missing campaigns
        return !!value?.toString().trim();
      }
    });

    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: 'warning', // Changed from critical to warning since we auto-create
      message: 'Range will be auto-created for review',
      validate: (value, record, allRecords, masterData) => {
        // Always return true since we'll auto-create missing ranges
        return !!value?.toString().trim();
      }
    });
  }

  // Get summary of what was auto-created in this session
  getAutoCreatedSummary(): {
    campaigns: { id: number; name: string; created: boolean }[];
    ranges: { id: number; name: string; created: boolean }[];
    totalCreated: number;
  } {
    const campaigns = this.createdInSession.filter(r => r.campaign).map(r => r.campaign!);
    const ranges = this.createdInSession.filter(r => r.range).map(r => r.range!);
    
    return {
      campaigns,
      ranges,
      totalCreated: campaigns.length + ranges.length
    };
  }

  // Reset session tracking
  resetSession(): void {
    this.autoCreatedEntities.clear();
    this.createdInSession = [];
  }

  // Clean up resources
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}