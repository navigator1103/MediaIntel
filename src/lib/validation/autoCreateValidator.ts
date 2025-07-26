import { PrismaClient } from '@prisma/client';
import { MediaSufficiencyValidator } from './mediaSufficiencyValidator';

const prisma = new PrismaClient();

export interface AutoCreateResult {
  campaign?: {
    id: number;
    name: string;
    created: boolean;
  };
}

export class AutoCreateValidator extends MediaSufficiencyValidator {
  private autoCreatedEntities: Set<string> = new Set();
  private createdInSession: AutoCreateResult[] = [];

  constructor(masterData?: any, abpCycle?: string) {
    // Call parent constructor with autoCreateMode = false since we handle it ourselves
    super(masterData, false, abpCycle);
  }

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

  async validateRange(rangeName: string): Promise<{ id: number; name: string; exists: boolean }> {
    const cleanName = rangeName.toString().trim();
    
    // Check if range exists - use toLowerCase() for case-insensitive match
    const cleanNameLower = cleanName.toLowerCase();
    let ranges = await prisma.range.findMany({
      where: { 
        status: { not: 'archived' } // Don't use archived ranges
      }
    });
    
    // Filter manually for case-insensitive match
    const range = ranges.find(r => r.name.toLowerCase() === cleanNameLower);
    
    if (range) {
      return { id: range.id, name: range.name, exists: true };
    }
    
    // Range not found - return null result to indicate validation failure
    throw new Error(`Range "${cleanName}" does not exist and must be created manually`);
  }

  // Override validation rules to allow campaign auto-creation but keep ranges strict
  protected initializeRules(): void {
    super.initializeRules();
    
    // Remove ONLY the basic campaign existence rule - keep the campaign-category relationship rule
    this.rules = this.rules.filter(rule => {
      // Remove the basic campaign existence rule that just checks if campaign exists
      if (rule.field === 'Campaign' && rule.type === 'relationship' && 
          rule.message === 'Campaign does not exist and will be auto-created during import') {
        return false;
      }
      // Remove range validation rules (we'll keep ranges strict)
      if (rule.field === 'Range' && (rule.type === 'relationship' || rule.type === 'cross_reference')) {
        return false;
      }
      // Keep all other rules including the critical campaign-category relationship rule
      return true;
    });
    
    // Add new auto-creating validation rule for non-existent campaigns
    this.rules.push({
      field: 'Campaign',
      type: 'relationship',
      severity: 'warning', // Warning for auto-creation, not blocking
      message: 'Campaign will be auto-created for review',
      validate: (value, record, allRecords, masterData) => {
        if (!value?.toString().trim()) return true; // If empty, let required validation handle it
        
        const campaignName = value.toString().trim();
        const campaigns = masterData?.campaigns || [];
        
        // Ensure campaigns is an array before using .some()
        if (!Array.isArray(campaigns)) {
          return false; // Show warning if campaigns is not an array
        }
        
        // Check if campaign exists (case-insensitive) with null safety
        const exists = campaigns.some((c: string) => 
          c && typeof c === 'string' && c.toLowerCase() === campaignName.toLowerCase()
        );
        
        // Return true if exists (no warning), false if doesn't exist (show warning for auto-creation)
        return exists;
      }
    });

    // Add strict range validation to ensure ranges must exist
    this.rules.push({
      field: 'Range',
      type: 'relationship',
      severity: 'critical',
      message: 'Range must exist in the system before import - ranges are not auto-created',
      validate: (value, record, allRecords, masterData) => {
        if (!value) return false;
        
        const rangeName = value.toString().trim();
        const ranges = masterData?.ranges || [];
        
        // Check if range exists (case-insensitive)
        const exists = ranges.some((r: string) => 
          r.toLowerCase() === rangeName.toLowerCase()
        );
        
        return exists;
      }
    });
  }

  // Get summary of what was auto-created in this session
  getAutoCreatedSummary(): {
    campaigns: { id: number; name: string; created: boolean }[];
    totalCreated: number;
  } {
    const campaigns = this.createdInSession.filter(r => r.campaign).map(r => r.campaign!);
    
    return {
      campaigns,
      totalCreated: campaigns.length
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