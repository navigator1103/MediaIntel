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
    
    // First check if campaign exists
    let campaign = await prisma.campaign.findFirst({
      where: { 
        name: {
          equals: cleanName,
          mode: 'insensitive'
        },
        status: { not: 'archived' } // Don't use archived campaigns
      }
    });
    
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
    campaign = await prisma.campaign.create({
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
    const result = { id: campaign.id, name: campaign.name, created: true };
    this.createdInSession.push({ campaign: result });
    
    console.log(`🆕 Auto-created campaign: "${cleanName}" (ID: ${campaign.id})`);
    
    return result;
  }

  async validateOrCreateRange(rangeName: string, importSource?: string): Promise<{ id: number; name: string; created: boolean }> {
    const cleanName = rangeName.toString().trim();
    
    // First check if range exists
    let range = await prisma.range.findFirst({
      where: { 
        name: {
          equals: cleanName,
          mode: 'insensitive'
        },
        status: { not: 'archived' } // Don't use archived ranges
      }
    });
    
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
    range = await prisma.range.create({
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
    const result = { id: range.id, name: range.name, created: true };
    this.createdInSession.push({ range: result });
    
    console.log(`🆕 Auto-created range: "${cleanName}" (ID: ${range.id})`);
    
    return result;
  }

  // Override the campaign validation rule to use auto-creation
  protected setupValidationRules(): void {
    super.setupValidationRules();
    
    // Remove the existing campaign and range validation rules
    this.rules = this.rules.filter(rule => 
      !(rule.field === 'Campaign' && rule.type === 'relationship') &&
      !(rule.field === 'Range' && rule.type === 'relationship')
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