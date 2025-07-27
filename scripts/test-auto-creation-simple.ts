import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simple auto-creation logic based on the sqlite import route
async function validateOrCreateCampaign(campaignName: string, importSource: string = 'test') {
  const cleanName = campaignName.toString().trim()
  
  // Check if campaign exists (case-insensitive)
  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: 'archived' } }
  })
  
  const existingCampaign = campaigns.find(c => c.name.toLowerCase() === cleanName.toLowerCase())
  
  if (existingCampaign) {
    return { id: existingCampaign.id, name: existingCampaign.name, created: false }
  }
  
  // Auto-create campaign
  const newCampaign = await prisma.campaign.create({
    data: {
      name: cleanName,
      status: 'pending_review',
      createdBy: 'import_auto',
      originalName: cleanName,
      notes: `Auto-created during import from ${importSource} on ${new Date().toISOString()}`
    }
  })
  
  console.log(`🆕 Auto-created campaign: "${cleanName}" (ID: ${newCampaign.id})`)
  return { id: newCampaign.id, name: newCampaign.name, created: true }
}

async function validateOrCreateRange(rangeName: string, importSource: string = 'test', categoryName?: string) {
  const cleanName = rangeName.toString().trim()
  
  // Check if range exists (case-insensitive)
  const ranges = await prisma.range.findMany({
    where: { status: { not: 'archived' } }
  })
  
  const existingRange = ranges.find(r => r.name.toLowerCase() === cleanName.toLowerCase())
  
  if (existingRange) {
    return { id: existingRange.id, name: existingRange.name, created: false }
  }
  
  // Auto-create range
  const newRange = await prisma.range.create({
    data: {
      name: cleanName,
      status: 'pending_review',
      createdBy: 'import_auto',
      originalName: cleanName,
      notes: `Auto-created during import from ${importSource} on ${new Date().toISOString()}`
    }
  })
  
  // Link to category if provided
  if (categoryName) {
    try {
      const categories = await prisma.category.findMany()
      const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
      
      if (category) {
        await prisma.categoryToRange.upsert({
          where: {
            categoryId_rangeId: {
              categoryId: category.id,
              rangeId: newRange.id
            }
          },
          update: {},
          create: {
            categoryId: category.id,
            rangeId: newRange.id
          }
        })
        console.log(`🔗 Linked range "${cleanName}" to category "${categoryName}"`)
      } else {
        console.warn(`⚠️ Could not find category "${categoryName}" to link with range "${cleanName}"`)
      }
    } catch (error) {
      console.error(`❌ Error linking range "${cleanName}" to category "${categoryName}":`, error)
    }
  }
  
  console.log(`🆕 Auto-created range: "${cleanName}" (ID: ${newRange.id})`)
  return { id: newRange.id, name: newRange.name, created: true }
}

async function testAutoCreationFlow() {
  try {
    console.log('🧪 Testing Game Plans Auto-Creation Flow\n')
    
    // Test scenario: Import data that needs new campaigns and ranges
    const testData = [
      {
        category: 'Deo',
        range: 'New Super Range Alpha',
        campaign: 'Summer Campaign 2025',
        importSource: 'test-csv-upload'
      },
      {
        category: 'Face Care',
        range: 'Anti-Age Premium',
        campaign: 'Spring Launch Beta',
        importSource: 'test-csv-upload'
      },
      {
        category: 'Deo', // Same category as first, different range
        range: 'Cool Refresh Series',
        campaign: 'Summer Campaign 2025', // Same campaign as first
        importSource: 'test-csv-upload'
      }
    ]
    
    const results = {
      campaigns: { created: 0, existing: 0 },
      ranges: { created: 0, existing: 0 }
    }
    
    // Step 1: Process ranges first (with category linking)
    console.log('🎯 Step 1: Processing Ranges with Category Linking')
    
    const processedRanges = new Map<string, number>()
    
    for (const record of testData) {
      if (!processedRanges.has(record.range)) {
        const rangeResult = await validateOrCreateRange(
          record.range, 
          record.importSource, 
          record.category
        )
        
        processedRanges.set(record.range, rangeResult.id)
        
        if (rangeResult.created) {
          results.ranges.created++
        } else {
          results.ranges.existing++
        }
      }
    }
    
    // Step 2: Process campaigns
    console.log('\n🎯 Step 2: Processing Campaigns')
    
    const processedCampaigns = new Map<string, number>()
    
    for (const record of testData) {
      if (!processedCampaigns.has(record.campaign)) {
        const campaignResult = await validateOrCreateCampaign(
          record.campaign,
          record.importSource
        )
        
        processedCampaigns.set(record.campaign, campaignResult.id)
        
        if (campaignResult.created) {
          results.campaigns.created++
        } else {
          results.campaigns.existing++
        }
        
        // Link campaign to range
        const rangeId = processedRanges.get(record.range)
        if (rangeId && campaignResult.created) {
          try {
            await prisma.campaign.update({
              where: { id: campaignResult.id },
              data: { rangeId: rangeId }
            })
            console.log(`🔗 Linked campaign "${record.campaign}" to range "${record.range}"`)
          } catch (error) {
            console.error(`❌ Error linking campaign to range:`, error)
          }
        }
      }
    }
    
    // Step 3: Show results
    console.log('\n📊 Auto-Creation Results Summary:')
    console.log(`   Ranges: ${results.ranges.created} created, ${results.ranges.existing} existing`)
    console.log(`   Campaigns: ${results.campaigns.created} created, ${results.campaigns.existing} existing`)
    
    // Step 4: Verify what was created
    console.log('\n🔍 Verification: What was auto-created?')
    
    const autoCreatedCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'pending_review',
        createdBy: 'import_auto'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`\n📝 Auto-created campaigns (${autoCreatedCampaigns.length}):`)
    autoCreatedCampaigns.forEach((campaign, index) => {
      console.log(`   ${index + 1}. "${campaign.name}" (ID: ${campaign.id})`)
      console.log(`      Status: ${campaign.status}, Range ID: ${campaign.rangeId}`)
    })
    
    const autoCreatedRanges = await prisma.range.findMany({
      where: {
        status: 'pending_review',
        createdBy: 'import_auto'
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`\n📦 Auto-created ranges (${autoCreatedRanges.length}):`)
    autoCreatedRanges.forEach((range, index) => {
      const linkedCategories = range.categories.map(cr => cr.category.name).join(', ')
      console.log(`   ${index + 1}. "${range.name}" (ID: ${range.id})`)
      console.log(`      Categories: ${linkedCategories || 'None'}`)
    })
    
    console.log('\n✅ Auto-creation testing completed!')
    
  } catch (error) {
    console.error('❌ Error in auto-creation test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAutoCreationFlow()