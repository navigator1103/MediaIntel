import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCampaignRangeMappings() {
  try {
    console.log('Updating campaign-range mappings...');
    
    // Define the range-campaign mappings based on your provided data
    const rangeCampaignMappings: Record<string, string[]> = {
      'Black & White': [
        'Black & White', 'Black & White Male', 'Black & White Female', 'Grand Slam'
      ],
      'Bliss': [
        'Bliss'
      ],
      'Clinical': [
        'Clinical', 'Clinical Even Tone', 'Zazil', 'Sachet'
      ],
      'Cool Kick': [
        'Cool Kick'
      ],
      'Deo Even Tone': [
        'Deo Even Tone', 'Extra Bright', 'Deo Even Tone Range', 'Clinical Even Tone'
      ],
      'Deo Men': [
        'Deo Men'
      ],
      'Dry Rollon': [
        'Dry Rollon', 'Rollon Men'
      ],
      'Hijab': [
        'Hijab', 'Hijab Fresh'
      ],
      'Men Deep': [
        'Men Deep', 'Deep'
      ],
      'Pearl & Beauty': [
        'Pearl & Beauty'
      ],
      'Skin Hero': [
        'Skin Hero', 'Skin Power (Hero)'
      ],
      'X-Range': [
        'X-Range', 'Derma Control'
      ],
      'Cellular': [
        'Cellular Bakuchiol', 'Social AWON', 'Search AWON', 'Speedy Gonzales', '50 Shades', 'Stardust', 'Stargate', 'Midnight Gold', 'Polaris', 'Sirius'
      ],
      'Epigenetics': [
        'Swan Lake', 'Genie', 'Genzit', 'Elsa', 'Sirena', 'Next Gen', 'Elevator'
      ],
      'Facial': [
        'Skin Gin'
      ],
      'Luminous 630': [
        'Luminous Launch India', 'Potinhos', 'Lucia', 'Bright Oil Clear', 'Q10 Skinclock & Moonlight', 'Q10 Body'
      ],
      'Q10': [
        'Q10 Guardian', 'Orionis', 'Q10 Skin Diet', 'Neige', 'Q10 Range'
      ],
      'C&HYA': [
        'C&HYA', 'Fanta'
      ],
      'Acne': [
        'Acne', 'Genzit', 'Derma Skin Clear', 'Acne Control'
      ],
      'Rose Care': [
        'Rose Care'
      ],
      'Micellar': [
        'Micellar Aminoacids', 'Micellar+', 'Micellar Siri', 'Micellar Melange', 'Micellar Core', 'Micellar Siri 2.0', 'Micellar Pearl Bright', 'Micellar Extra'
      ],
      'Daily Essentials': [
        'Daily Essentials'
      ],
      'APC': [
        'APC', 'Skin Hero (THA)'
      ],
      'Body Aloe': [
        'Body Aloe', 'Body Aloe Summer'
      ],
      'Body Milk': [
        'Body Milk', 'Body Milk 5 in 1'
      ],
      'Dark Skin': [
        'Dark Skin', 'Radiant Beauty'
      ],
      'Extra Bright': [
        'Extra Bright', 'Bright Signature', 'Extra Bright Starwalker'
      ],
      'Natural Glow': [
        'Natural Glow'
      ],
      'Repair & Care': [
        'Repair & Care'
      ],
      'Vitamin Range': [
        'Vitamin Range', 'Super 10', 'Hera', 'Unicorn Super 10'
      ],
      'Lip': [
        'Lip'
      ],
      'Deep': [
        'Deep', 'Deep Cleansing', 'Disney', 'Deep X-Cat', 'Deep Moisturizing', 'Auto-Matic Deep'
      ],
      'Men': [
        'Men', 'DSR Range'
      ],
      'Sensitive': [
        'Sensitive', 'Sensitive Moisture'
      ],
      'Protect & Moisture': [
        'Protect & Moisture'
      ],
      'Sun': [
        'Sun', 'Sun Range'
      ],
      'UV Face': [
        'UV Face', 'UV Specialist', 'Subelieavable UV'
      ]
    };
    
    // Add additional campaigns that appear in multiple columns but weren't captured above
    const additionalMappings = {
      'Harmattan': 'Dark Skin',
      'Zuri': 'Dark Skin', 
      'EMUR': 'Micellar',
      'Claro': 'Micellar',
      'Tetris': 'Repair & Care',
      'Soft': 'Repair & Care',
      'Soft UV': 'Repair & Care',
      'Iconova': 'Vitamin Range',
      'Phoenix': 'Vitamin Range',
      'Core Asean': 'Natural Glow',
      'Golden Fruit': 'Natural Glow',
      'Super 8 Core': 'Natural Glow',
      'C&AHA and Super C+': 'Natural Glow',
      'C&E': 'Natural Glow',
      'C&E Tata': 'Natural Glow',
      'Tinder': 'UV Face',
      'Korea': 'Sensitive',
      'Nemo': 'Sensitive',
      'NM Moisture Challenge': 'Deep',
      'Lifecycle': 'Body Milk',
      'Milka': 'Vitamin Range',
      'Ghostbuster': 'Vitamin Range',
      'Petals 2022': 'Rose Care',
      'Fendi': 'Clinical',
      'Crème': 'Repair & Care',
      'Crème Round 2': 'Repair & Care',
      'Soft UV Ozonio': 'Repair & Care',
      'Neverland': 'Repair & Care',
      'Vitamin Scrub': 'Vitamin Range'
    };
    
    // Add additional mappings to the main structure
    for (const [campaign, range] of Object.entries(additionalMappings)) {
      if (rangeCampaignMappings[range]) {
        rangeCampaignMappings[range].push(campaign);
      }
    }
    
    // Clear existing range assignments from campaigns
    await prisma.campaign.updateMany({
      data: {
        rangeId: null
      }
    });
    console.log('Cleared existing campaign-range assignments');
    
    let mappedCount = 0;
    let notFoundRanges = 0;
    let notFoundCampaigns = 0;
    
    // Create the mappings
    for (const [rangeName, campaignNames] of Object.entries(rangeCampaignMappings)) {
      // Find the range
      const range = await prisma.range.findUnique({
        where: { name: rangeName }
      });
      
      if (!range) {
        console.log(`Warning: Range '${rangeName}' not found`);
        notFoundRanges++;
        continue;
      }
      
      for (const campaignName of campaignNames) {
        // Find the campaign
        const campaign = await prisma.campaign.findUnique({
          where: { name: campaignName }
        });
        
        if (!campaign) {
          console.log(`Warning: Campaign '${campaignName}' not found for range '${rangeName}'`);
          notFoundCampaigns++;
          continue;
        }
        
        // Update the campaign to link to this range
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { rangeId: range.id }
        });
        
        console.log(`✅ Mapped: ${rangeName} -> ${campaignName}`);
        mappedCount++;
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`✅ Successfully mapped: ${mappedCount} campaigns`);
    console.log(`⚠️  Ranges not found: ${notFoundRanges}`);
    console.log(`⚠️  Campaigns not found: ${notFoundCampaigns}`);
    
    // Verify some key mappings
    const bodyMilkCampaigns = await prisma.campaign.findMany({
      where: {
        range: { name: 'Body Milk' }
      },
      select: { name: true }
    });
    
    console.log(`\nBody Milk range now includes these campaigns:`);
    bodyMilkCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.name}`);
    });
    
  } catch (error) {
    console.error('Error updating campaign-range mappings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateCampaignRangeMappings();