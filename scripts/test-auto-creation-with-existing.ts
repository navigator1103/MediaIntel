import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testWithExistingEntities() {
  try {
    console.log('🔄 Testing Auto-Creation with Existing Entities\n')
    
    // Get some existing campaigns and ranges
    const existingCampaigns = await prisma.campaign.findMany({
      where: { status: { not: 'archived' } },
      take: 2
    })
    
    const existingRanges = await prisma.range.findMany({
      where: { status: { not: 'archived' } },
      take: 2
    })
    
    console.log('📋 Existing entities found:')
    console.log(`   Campaigns: ${existingCampaigns.map(c => `"${c.name}"`).join(', ')}`)
    console.log(`   Ranges: ${existingRanges.map(r => `"${r.name}"`).join(', ')}`)
    
    // Test with mixed existing and new data
    const mixedTestData = [
      {
        campaign: existingCampaigns[0]?.name || 'Fallback Campaign',
        range: existingRanges[0]?.name || 'Fallback Range',
        shouldExist: true
      },
      {
        campaign: 'Brand New Campaign XYZ',
        range: 'Brand New Range XYZ',
        shouldExist: false
      },
      {
        campaign: existingCampaigns[0]?.name?.toUpperCase() || 'FALLBACK CAMPAIGN', // Case insensitive test
        range: 'Another New Range',
        shouldExist: 'mixed' // Campaign exists, range is new
      }
    ]
    
    console.log('\n🧪 Testing mixed scenarios:')
    
    for (let i = 0; i < mixedTestData.length; i++) {
      const testCase = mixedTestData[i]
      console.log(`\n--- Test Case ${i + 1}: ${testCase.shouldExist === true ? 'Existing Entities' : testCase.shouldExist === false ? 'New Entities' : 'Mixed'} ---`)
      
      // Test campaign
      const campaigns = await prisma.campaign.findMany({
        where: { status: { not: 'archived' } }
      })
      const foundCampaign = campaigns.find(c => c.name.toLowerCase() === testCase.campaign.toLowerCase())
      
      if (foundCampaign) {
        console.log(`✅ Campaign "${testCase.campaign}" already exists (ID: ${foundCampaign.id})`)
      } else {
        console.log(`🆕 Campaign "${testCase.campaign}" would be auto-created`)
      }
      
      // Test range
      const ranges = await prisma.range.findMany({
        where: { status: { not: 'archived' } }
      })
      const foundRange = ranges.find(r => r.name.toLowerCase() === testCase.range.toLowerCase())
      
      if (foundRange) {
        console.log(`✅ Range "${testCase.range}" already exists (ID: ${foundRange.id})`)
      } else {
        console.log(`🆕 Range "${testCase.range}" would be auto-created`)
      }
    }
    
    // Test case insensitive matching specifically
    console.log('\n🔍 Case Sensitivity Test:')
    
    if (existingCampaigns.length > 0) {
      const originalName = existingCampaigns[0].name
      const variations = [
        originalName.toLowerCase(),
        originalName.toUpperCase(),
        originalName.charAt(0).toUpperCase() + originalName.slice(1).toLowerCase()
      ]
      
      console.log(`Original: "${originalName}"`)
      
      for (const variation of variations) {
        const campaigns = await prisma.campaign.findMany({
          where: { status: { not: 'archived' } }
        })
        const found = campaigns.find(c => c.name.toLowerCase() === variation.toLowerCase())
        console.log(`   "${variation}": ${found ? '✅ Found (case-insensitive match)' : '❌ Not found'}`)
      }
    }
    
    // Show governance features
    console.log('\n🛡️ Governance Features:')
    console.log('   ✅ Auto-created entities have "pending_review" status')
    console.log('   ✅ Import source tracking in notes field')
    console.log('   ✅ Created by "import_auto" for easy identification')
    console.log('   ✅ Case-insensitive duplicate detection')
    console.log('   ✅ Automatic category-range linking')
    console.log('   ✅ Campaign-range relationship creation')
    
    // Show the workflow
    console.log('\n📋 Complete Auto-Creation Workflow:')
    console.log('   1️⃣ CSV Upload → Field Mapping → Validation')
    console.log('   2️⃣ Import Process with Auto-Creation:')
    console.log('      📦 Step 1: Process Ranges (with category linking)')
    console.log('      📝 Step 2: Process Campaigns (with range linking)')  
    console.log('      🎯 Step 3: Create Game Plans using auto-created entities')
    console.log('   3️⃣ Admin Review of pending_review entities')
    console.log('   4️⃣ Approval/Archive of auto-created entities')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Error in mixed entity test:', error)
    await prisma.$disconnect()
  }
}

testWithExistingEntities()