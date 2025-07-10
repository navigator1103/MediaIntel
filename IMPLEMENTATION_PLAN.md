# Auto-Create Entities with Governance - Implementation Plan

## 🎯 **Overview**
This feature allows automatic creation of missing campaigns and ranges during game plans import, with administrative governance to review and approve auto-created entities.

## 🔄 **Rollback Strategy**
```bash
# Return to current state anytime:
git checkout main
cp ./prisma/media_sufficiency_backup_before_auto_creation_20250704_003159.db ./prisma/media_sufficiency.db
```

## 📋 **Phase 1: Database Schema Updates**

### **Add Governance Fields to Campaign and Range Models**

```prisma
model Campaign {
  id           Int        @id @default(autoincrement())
  name         String     @unique(map: "sqlite_autoindex_campaigns_1")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @default(now()) @updatedAt @map("updated_at")
  rangeId      Int?       @map("range_id")
  
  // New Governance Fields
  status       String     @default("active")  // "active", "pending_review", "merged", "archived"
  createdBy    String?    @map("created_by")  // "import_auto", "manual", "admin"
  reviewedBy   String?    @map("reviewed_by") // Admin who reviewed
  reviewedAt   DateTime?  @map("reviewed_at") // When reviewed
  originalName String?    @map("original_name") // Original name from import
  mergedInto   Int?       @map("merged_into") // If merged into another campaign
  notes        String?    // Admin notes
  
  range        Range?     @relation(fields: [rangeId], references: [id])
  gamePlans    GamePlan[]
  mergedCampaigns Campaign[] @relation("CampaignMerge", fields: [mergedInto], references: [id])
  parentCampaign Campaign? @relation("CampaignMerge")

  @@map("campaigns")
}

model Range {
  id           Int               @id @default(autoincrement())
  name         String            @unique(map: "sqlite_autoindex_ranges_1")
  createdAt    DateTime          @default(now()) @map("created_at")
  updatedAt    DateTime          @default(now()) @updatedAt @map("updated_at")
  category_id  Int?
  
  // New Governance Fields
  status       String            @default("active")  // "active", "pending_review", "merged", "archived"
  createdBy    String?           @map("created_by")  // "import_auto", "manual", "admin"
  reviewedBy   String?           @map("reviewed_by") // Admin who reviewed
  reviewedAt   DateTime?         @map("reviewed_at") // When reviewed
  originalName String?           @map("original_name") // Original name from import
  mergedInto   Int?              @map("merged_into") // If merged into another range
  notes        String?           // Admin notes
  
  categories   CategoryToRange[]
  campaigns    Campaign[]
  mergedRanges Range[]           @relation("RangeMerge", fields: [mergedInto], references: [id])
  parentRange  Range?            @relation("RangeMerge")

  @@map("ranges")
}
```

## 📋 **Phase 2: Modified Validation Logic**

### **Update `mediaSufficiencyValidator.ts`**

```typescript
// New auto-creation logic
const validateOrCreateCampaign = async (campaignName: string) => {
  // Check if campaign exists
  let campaign = await prisma.campaign.findUnique({ 
    where: { name: campaignName } 
  });
  
  if (!campaign) {
    // Auto-create with pending status
    campaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        status: 'pending_review',
        createdBy: 'import_auto',
        originalName: campaignName,
        notes: `Auto-created during import on ${new Date().toISOString()}`
      }
    });
    
    // Log for admin review
    console.log(`Auto-created campaign: ${campaignName}`);
  }
  
  return campaign;
};

const validateOrCreateRange = async (rangeName: string) => {
  // Similar logic for ranges
  let range = await prisma.range.findUnique({ 
    where: { name: rangeName } 
  });
  
  if (!range) {
    range = await prisma.range.create({
      data: {
        name: rangeName,
        status: 'pending_review',
        createdBy: 'import_auto',
        originalName: rangeName,
        notes: `Auto-created during import on ${new Date().toISOString()}`
      }
    });
  }
  
  return range;
};
```

## 📋 **Phase 3: Governance Admin Interface**

### **New Admin Page: `/admin/governance`**

Features:
- **Pending Review Tab**: Lists all auto-created entities awaiting review
- **Approve/Reject Actions**: Approve to make active, reject to archive
- **Merge Functionality**: Merge duplicates into existing entities
- **Bulk Operations**: Handle multiple entities at once
- **History Tracking**: Show all governance actions

### **Key Components:**

1. **Pending Entities Grid**
   - Campaign/Range name
   - Original import source
   - Date created
   - Current usage count
   - Action buttons (Approve, Merge, Archive)

2. **Merge Dialog**
   - Search existing entities
   - Preview merge impact
   - Confirm merge with notes

3. **Bulk Actions Toolbar**
   - Select all/none
   - Bulk approve
   - Bulk archive
   - Export to CSV

## 📋 **Phase 4: API Endpoints**

### **New Governance APIs**

```typescript
// GET /api/admin/governance/pending
// Returns all pending campaigns and ranges

// POST /api/admin/governance/approve
// Approve entity (change status to 'active')

// POST /api/admin/governance/merge
// Merge entity into existing one

// POST /api/admin/governance/archive
// Archive entity (change status to 'archived')

// GET /api/admin/governance/history
// Get governance action history
```

## 📋 **Phase 5: Dashboard Updates**

### **Handle Different Entity Statuses**

```typescript
// Update dashboard queries to handle governance
const activeCampaigns = await prisma.campaign.findMany({
  where: { 
    status: { in: ['active', 'pending_review'] } // Include pending for counts
  }
});

// Add indicators in UI for pending entities
const CampaignName = ({ campaign }) => (
  <span className={campaign.status === 'pending_review' ? 'text-orange-600' : ''}>
    {campaign.name}
    {campaign.status === 'pending_review' && (
      <span className="ml-1 text-xs bg-orange-100 px-1 rounded">PENDING</span>
    )}
  </span>
);
```

## 📋 **Phase 6: Import Workflow Enhancement**

### **Enhanced Import Process**

1. **Pre-Import Analysis**
   - Scan CSV for missing entities
   - Show preview of what will be auto-created
   - Allow admin to pre-approve or modify

2. **During Import**
   - Auto-create missing entities with governance tracking
   - Continue import without blocking

3. **Post-Import Summary**
   - Show what was imported
   - List auto-created entities requiring review
   - Provide direct link to governance page

## 🔧 **Implementation Steps**

### **Step 1: Database Migration**
```bash
npx prisma db push  # Apply schema changes
```

### **Step 2: Update Validation Logic**
- Modify `mediaSufficiencyValidator.ts`
- Update import APIs

### **Step 3: Create Governance Interface**
- New admin page `/admin/governance`
- API endpoints for governance actions

### **Step 4: Update Dashboards**
- Handle pending entities in displays
- Add status indicators

### **Step 5: Testing**
- Test auto-creation workflow
- Test governance actions
- Test dashboard integration

## 🎯 **Benefits**

1. **No More Import Failures**: Auto-creation prevents blocked imports
2. **Data Quality Control**: Governance ensures clean master data
3. **Admin Oversight**: Full visibility and control over auto-created entities
4. **Audit Trail**: Complete history of governance decisions
5. **Flexibility**: Merge, approve, or archive as needed

## ⚠️ **Considerations**

1. **Performance**: Auto-creation during large imports may slow down process
2. **Data Volume**: Pending entities may accumulate if not reviewed regularly
3. **User Training**: Admins need training on governance workflow
4. **Rollback Complexity**: More complex to rollback once governance actions are taken

## 🚀 **Migration Strategy**

1. **All existing entities**: Automatically set to `status: 'active'`
2. **New imports**: Use auto-creation with governance
3. **Gradual rollout**: Start with test environments first