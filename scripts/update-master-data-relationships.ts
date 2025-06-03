import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Load the masterData.json file
const masterDataPath = path.resolve('./src/lib/validation/masterData.json');
const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

async function main() {
  console.log('Starting database update with masterData.json relationships...');

  // Extract categories and ranges from masterData.json
  const categories = masterData.categories || [];
  const ranges = masterData.ranges || [];
  const categoryToRanges = masterData.categoryToRanges || {};
  const rangeToCategories = masterData.rangeToCategories || {};

  try {
    // Create categories if they don't exist
    console.log('Ensuring all categories exist in database...');
    for (const categoryName of categories) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: categoryName }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: { name: categoryName }
        });
        console.log(`Created category: ${categoryName}`);
      } else {
        console.log(`Category already exists: ${categoryName}`);
      }
    }

    // Create ranges if they don't exist
    console.log('Ensuring all ranges exist in database...');
    for (const rangeName of ranges) {
      const existingRange = await prisma.range.findUnique({
        where: { name: rangeName }
      });

      if (!existingRange) {
        await prisma.range.create({
          data: { name: rangeName }
        });
        console.log(`Created range: ${rangeName}`);
      } else {
        console.log(`Range already exists: ${rangeName}`);
      }
    }

    // Create relationships from categoryToRanges
    console.log('Creating relationships from categoryToRanges...');
    const relationships = [];

    // Process categoryToRanges
    for (const [categoryName, rangeNames] of Object.entries(categoryToRanges)) {
      for (const rangeName of (rangeNames as string[])) {
        relationships.push({ categoryName, rangeName });
      }
    }

    // Process rangeToCategories to ensure bidirectional relationships
    for (const [rangeName, categoryNames] of Object.entries(rangeToCategories)) {
      for (const categoryName of (categoryNames as string[])) {
        // Check if this relationship is already in our list
        const exists = relationships.some(
          rel => rel.categoryName === categoryName && rel.rangeName === rangeName
        );
        
        if (!exists) {
          relationships.push({ categoryName, rangeName });
        }
      }
    }

    // Create all relationships
    console.log(`Creating ${relationships.length} category-range relationships...`);
    for (const rel of relationships) {
      const category = await prisma.category.findUnique({
        where: { name: rel.categoryName }
      });

      const range = await prisma.range.findUnique({
        where: { name: rel.rangeName }
      });

      if (category && range) {
        // Check if relationship already exists
        const existingRelationship = await prisma.categoryToRange.findUnique({
          where: {
            categoryId_rangeId: {
              categoryId: category.id,
              rangeId: range.id
            }
          }
        });

        if (!existingRelationship) {
          await prisma.categoryToRange.create({
            data: {
              categoryId: category.id,
              rangeId: range.id
            }
          });
          console.log(`Created relationship: ${rel.categoryName} -> ${rel.rangeName}`);
        } else {
          console.log(`Relationship already exists: ${rel.categoryName} -> ${rel.rangeName}`);
        }
      } else {
        console.log(`Could not create relationship: ${rel.categoryName} -> ${rel.rangeName} (category or range not found)`);
      }
    }

    console.log('Database update completed successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
