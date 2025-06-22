import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCategoryRangeMappings() {
  try {
    console.log('🔄 Updating database category-range mappings...');

    // Clear existing category-range mappings
    await prisma.categoryToRange.deleteMany({});
    console.log('✅ Cleared existing category-range mappings');

    // Updated category to ranges mapping based on your latest structure
    const categoryToRanges = {
      "Hand Body": [
        "Soft", "Aloe", "Milk", "Vitamin Range", "Vitamin Serum", 
        "Radiant Beauty", "Crème", "Luminous 630", "Q10", "Brightness", 
        "Repair & Care", "Even Tone Core", "Natural Glow"
      ],
      "Deo": [
        "Pearl & Beauty", "Black & White", "Deep", "Even Tone", "Skin Hero", 
        "Dry Deo", "Deep Men", "Derma Control", "Clinical", "Hijab", "Cool Kick"
      ],
      "Face Care": [
        "Luminous 630", "Cellular", "Epigenetics", "Q10", "Facial", "Acne"
      ],
      "X-Cat": [
        "All"
      ],
      "Face Cleansing": [
        "Acne", "Micellar", "Daily Essentials"
      ],
      "Men": [
        "Deep", "Cool Kick", "Men", "Sensitive", "Extra Bright", "Acne"
      ],
      "Sun": [
        "UV Face", "Protect & Moisture", "Sun"
      ],
      "Lip": [
        "Lip"
      ],
      // Keep existing derma categories
      "Acne": ["Acne"],
      "Anti Age": ["Anti Age"],
      "Anti Pigment": ["Anti Pigment"],
      "Dry Skin": ["Body Lotion", "Hydration", "Aquaphor", "pH5", "Atopi", "Repair"]
    };

    // Get all categories and ranges from database
    const categories = await prisma.category.findMany();
    const ranges = await prisma.range.findMany();

    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const rangeMap = new Map(ranges.map(r => [r.name, r.id]));

    let mappingsCreated = 0;

    // Create new mappings
    for (const [categoryName, rangeNames] of Object.entries(categoryToRanges)) {
      const categoryId = categoryMap.get(categoryName);
      
      if (!categoryId) {
        console.log(`⚠️  Category not found: ${categoryName}`);
        continue;
      }

      for (const rangeName of rangeNames) {
        const rangeId = rangeMap.get(rangeName);
        
        if (!rangeId) {
          console.log(`⚠️  Range not found: ${rangeName}`);
          continue;
        }

        try {
          await prisma.categoryToRange.create({
            data: {
              categoryId,
              rangeId
            }
          });
          mappingsCreated++;
        } catch (error: any) {
          console.log(`⚠️  Error creating mapping ${categoryName} -> ${rangeName}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Created ${mappingsCreated} new category-range mappings`);
    console.log(`📂 Categories processed: ${Object.keys(categoryToRanges).length}`);
    
    // Verify some mappings
    const sampleMappings = await prisma.categoryToRange.findMany({
      take: 10,
      include: {
        category: { select: { name: true } },
        range: { select: { name: true } }
      }
    });
    
    console.log('\n📊 Sample mappings created:');
    sampleMappings.forEach(mapping => {
      console.log(`${mapping.category.name} → ${mapping.range.name}`);
    });

  } catch (error) {
    console.error('❌ Error updating category-range mappings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCategoryRangeMappings();