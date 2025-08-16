import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parse';

const prisma = new PrismaClient();

interface CSVRow {
  Category: string;
  Campaign: string;
  'Business Unit': string;
  [key: string]: string;
}

async function fixCategories() {
  try {
    console.log('Fixing FC05 2025 category mappings...');
    
    // Get FC05 2025 last update
    const lastUpdate = await prisma.lastUpdate.findFirst({
      where: { name: 'FC05 2025' }
    });
    
    if (!lastUpdate) {
      console.error('FC05 2025 not found');
      return;
    }
    
    // Read CSV to get category mappings
    const csvFilePath = '/Users/naveedshah/Downloads/FC05 data_clean and in Nebula template_Gameplan tab.csv';
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    const records: CSVRow[] = await new Promise((resolve, reject) => {
      csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    console.log('First record:', records[0]);
    console.log('Total records:', records.length);
    
    // Build a map of campaign -> category
    const campaignCategoryMap: Record<string, string> = {};
    records.forEach(row => {
      // Handle BOM character in column name
      const category = row.Category || row['﻿Category'];
      if (row.Campaign && category && category !== 'N/A') {
        campaignCategoryMap[row.Campaign] = category;
      }
    });
    
    console.log('Sample campaign mappings:');
    console.log('Dermo Purifyer ->', campaignCategoryMap['Dermo Purifyer']);
    console.log('Epigenetics ->', campaignCategoryMap['Epigenetics']);
    console.log('Total mappings:', Object.keys(campaignCategoryMap).length);
    
    // Get all FC05 2025 game plans
    const gamePlans = await prisma.gamePlan.findMany({
      where: {
        last_update_id: lastUpdate.id
      },
      include: {
        campaign: true
      }
    });
    
    console.log(`Found ${gamePlans.length} FC05 2025 game plans to update`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const gamePlan of gamePlans) {
      if (!gamePlan.campaign) continue;
      
      const categoryName = campaignCategoryMap[gamePlan.campaign.name];
      if (!categoryName) {
        notFoundCount++;
        continue;
      }
      
      // Find the category (regardless of business unit)
      const category = await prisma.category.findFirst({
        where: { name: categoryName }
      });
      
      if (category) {
        await prisma.gamePlan.update({
          where: { id: gamePlan.id },
          data: { category_id: category.id }
        });
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} game plans...`);
        }
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total game plans: ${gamePlans.length}`);
    console.log(`Updated with categories: ${updatedCount}`);
    console.log(`No category found in CSV: ${notFoundCount}`);
    
    // Verify the update
    const categoryCounts = await prisma.$queryRaw`
      SELECT c.name, COUNT(*) as count 
      FROM game_plans gp 
      LEFT JOIN categories c ON gp.category_id = c.id 
      WHERE gp.last_update_id = ${lastUpdate.id}
      GROUP BY c.name 
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('\nTop categories after update:');
    console.log(categoryCounts);
    
  } catch (error) {
    console.error('Error fixing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategories();