import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function generateUpdatedMasterData() {
  try {
    console.log('=== Generating Updated Master Data ===\n');

    // Get all data from database
    const categories = await prisma.category.findMany({
      include: {
        businessUnit: true,
        ranges: {
          include: {
            range: {
              include: {
                campaigns: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const ranges = await prisma.range.findMany({
      include: {
        campaigns: true,
        categories: {
          include: {
            category: {
              include: {
                businessUnit: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const campaigns = await prisma.campaign.findMany({
      include: {
        range: {
          include: {
            categories: {
              include: {
                category: {
                  include: {
                    businessUnit: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        categories: {
          include: {
            ranges: {
              include: {
                range: {
                  include: {
                    campaigns: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('Database Statistics:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Ranges: ${ranges.length}`);
    console.log(`- Campaigns: ${campaigns.length}`);
    console.log(`- Business Units: ${businessUnits.length}\n`);

    // Separate by business unit
    const dermaCategories = categories.filter(cat => cat.businessUnit?.name === 'Derma');
    const niveaCategories = categories.filter(cat => cat.businessUnit?.name === 'Nivea');

    console.log('=== Business Unit Breakdown ===');
    console.log(`Derma Categories: ${dermaCategories.length}`);
    dermaCategories.forEach((cat, i) => console.log(`  ${i+1}. ${cat.name}`));
    
    console.log(`\nNivea Categories: ${niveaCategories.length}`);
    niveaCategories.forEach((cat, i) => console.log(`  ${i+1}. ${cat.name}`));

    // Generate new master data structure
    const masterData = {
      // Business Units
      businessUnits: businessUnits.map(bu => bu.name).filter(Boolean),
      
      // Categories by business unit
      dermaCategories: dermaCategories.map(cat => cat.name),
      niveaCategories: niveaCategories.map(cat => cat.name),
      
      // All categories (for backward compatibility)
      categories: categories.map(cat => cat.name),
      
      // All ranges
      ranges: ranges.map(range => range.name),
      
      // All campaigns  
      campaigns: campaigns.map(campaign => campaign.name),
      
      // Category to Ranges mapping
      categoryToRanges: {} as Record<string, string[]>,
      
      // Range to Categories mapping
      rangeToCategories: {} as Record<string, string[]>,
      
      // Range to Campaigns mapping
      rangeToCampaigns: {} as Record<string, string[]>,
      
      // Campaign to Range mapping
      campaignToRangeMap: {} as Record<string, string>,
      
      // Business Unit mappings
      categoryToBusinessUnit: {} as Record<string, string>,
      rangeToBusinessUnit: {} as Record<string, string>,
      campaignToBusinessUnit: {} as Record<string, string>,
      
      // Keep existing fields from original master data
      subRegions: [
        "ANZ", "LATAM", "AME", "INDIA", "ASEAN", "CIST", "TURKEY"
      ],
      mediaTypes: [
        "Digital", "Traditional", "Social", "Search", "Programmatic", 
        "Cinema", "OOH", "Radio", "TV", "Print"
      ],
      pmTypes: [
        "Full Funnel Advanced", "Full Funnel Basic", "GR Only", "Non PM", "PM Advanced"
      ],
      countries: [
        "Australia", "Brazil", "Centroamerica", "Chile", "Colombia", "Ecuador",
        "Egypt", "India", "Indonesia", "Malaysia", "Mexico", "Middle East",
        "Morocco", "Nigeria", "North Africa", "Peru", "Singapore", "South Africa",
        "Thailand", "Turkey", "Vietnam"
      ],
      countryToSubRegionMap: {
        "Australia": "ANZ", "India": "INDIA",
        "Indonesia": "ASEAN", "Malaysia": "ASEAN", "Singapore": "ASEAN", 
        "Thailand": "ASEAN", "Vietnam": "ASEAN",
        "Brazil": "LATAM", "Chile": "LATAM", "Colombia": "LATAM", 
        "Ecuador": "LATAM", "Centroamerica": "LATAM", "Mexico": "LATAM", "Peru": "LATAM",
        "Egypt": "AME", "Middle East": "AME", "Morocco": "AME", 
        "North Africa": "AME", "Nigeria": "AME", "South Africa": "AME",
        "Turkey": "TURKEY"
      },
      subRegionToCountriesMap: {
        "ANZ": ["Australia"],
        "INDIA": ["India"],
        "ASEAN": ["Indonesia", "Malaysia", "Singapore", "Thailand", "Vietnam"],
        "LATAM": ["Brazil", "Chile", "Colombia", "Ecuador", "Centroamerica", "Mexico", "Peru"],
        "AME": ["Egypt", "Middle East", "Morocco", "North Africa", "Nigeria", "South Africa"],
        "TURKEY": ["Turkey"]
      },
      lastUpdated: new Date().toISOString()
    };

    // Build category to ranges mapping
    categories.forEach(category => {
      const rangeNames = category.ranges.map(cr => cr.range.name);
      if (rangeNames.length > 0) {
        masterData.categoryToRanges[category.name] = rangeNames;
      }
      
      // Add business unit mapping
      if (category.businessUnit?.name) {
        masterData.categoryToBusinessUnit[category.name] = category.businessUnit.name as string;
      }
    });

    // Build range to categories mapping
    ranges.forEach(range => {
      const categoryNames = range.categories.map(cr => cr.category.name);
      if (categoryNames.length > 0) {
        masterData.rangeToCategories[range.name] = categoryNames;
      }
      
      // Add campaigns mapping
      const campaignNames = range.campaigns.map(c => c.name);
      if (campaignNames.length > 0) {
        masterData.rangeToCampaigns[range.name] = campaignNames;
      }
      
      // Add business unit mapping (get from linked categories)
      const businessUnits = new Set(range.categories.map(cr => cr.category.businessUnit?.name).filter(Boolean));
      if (businessUnits.size === 1) {
        masterData.rangeToBusinessUnit[range.name] = Array.from(businessUnits)[0] as string;
      }
    });

    // Build campaign to range mapping
    campaigns.forEach(campaign => {
      if (campaign.range) {
        masterData.campaignToRangeMap[campaign.name] = campaign.range.name;
        
        // Add business unit mapping (get from range's categories)
        const businessUnits = new Set(
          campaign.range.categories.map(cr => cr.category.businessUnit?.name).filter(Boolean)
        );
        if (businessUnits.size === 1) {
          masterData.campaignToBusinessUnit[campaign.name] = Array.from(businessUnits)[0] as string;
        }
      }
    });

    // Show summary of new master data
    console.log('\n=== New Master Data Summary ===');
    console.log(`Categories total: ${masterData.categories.length}`);
    console.log(`- Derma: ${masterData.dermaCategories.length}`);
    console.log(`- Nivea: ${masterData.niveaCategories.length}`);
    console.log(`Ranges: ${masterData.ranges.length}`);
    console.log(`Campaigns: ${masterData.campaigns.length}`);
    console.log(`Category→Range mappings: ${Object.keys(masterData.categoryToRanges).length}`);
    console.log(`Range→Campaign mappings: ${Object.keys(masterData.rangeToCampaigns).length}`);

    // Check for missing mappings
    console.log('\n=== Mapping Completeness Check ===');
    const categoriesWithoutRanges = masterData.categories.filter(cat => 
      !masterData.categoryToRanges[cat] || masterData.categoryToRanges[cat].length === 0
    );
    
    const rangesWithoutCampaigns = masterData.ranges.filter(range => 
      !masterData.rangeToCampaigns[range] || masterData.rangeToCampaigns[range].length === 0
    );

    if (categoriesWithoutRanges.length > 0) {
      console.log(`❌ Categories without ranges (${categoriesWithoutRanges.length}): ${categoriesWithoutRanges.join(', ')}`);
    } else {
      console.log('✅ All categories have ranges');
    }

    if (rangesWithoutCampaigns.length > 0) {
      console.log(`⚠️  Ranges without campaigns (${rangesWithoutCampaigns.length}): ${rangesWithoutCampaigns.join(', ')}`);
    } else {
      console.log('✅ All ranges have campaigns');
    }

    // Write the updated master data
    const masterDataPath = '/Users/naveedshah/Documents/Python/MIQ_Current/src/lib/validation/masterData.json';
    const backupPath = `/Users/naveedshah/Documents/Python/MIQ_Current/src/lib/validation/masterData.backup.${Date.now()}.json`;
    
    // Create backup
    if (fs.existsSync(masterDataPath)) {
      fs.copyFileSync(masterDataPath, backupPath);
      console.log(`\n📁 Backup created: ${backupPath}`);
    }
    
    // Write new master data
    fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));
    console.log(`✅ Updated master data written to: ${masterDataPath}`);

    console.log('\n🎉 Master data update complete!');

  } catch (error) {
    console.error('Error generating master data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateUpdatedMasterData();