import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

const prisma = new PrismaClient();

// Path to the old SQLite database
const oldDbPath = path.resolve('../golden-rules-dashboard/backend/database.sqlite');

// Function to connect to the old database
function connectToOldDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(oldDbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Function to query the old database
function queryOldDb(db: sqlite3.Database, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function importRegions(db: sqlite3.Database) {
  console.log('Importing regions...');
  const regions = await queryOldDb(db, 'SELECT * FROM regions');
  
  for (const region of regions) {
    await prisma.region.create({
      data: {
        id: region.id,
        name: region.name,
        createdAt: new Date(region.created_at || Date.now())
      }
    });
  }
  console.log(`Imported ${regions.length} regions`);
}

async function importCountries(db: sqlite3.Database) {
  console.log('Importing countries...');
  const countries = await queryOldDb(db, 'SELECT * FROM countries');
  
  for (const country of countries) {
    await prisma.country.create({
      data: {
        id: country.id,
        name: country.name,
        regionId: country.region_id,
        createdAt: new Date(country.created_at || Date.now())
      }
    });
  }
  console.log(`Imported ${countries.length} countries`);
}

async function importBrands(db: sqlite3.Database) {
  console.log('Importing brands...');
  const brands = await queryOldDb(db, 'SELECT * FROM brands');
  
  for (const brand of brands) {
    await prisma.brand.create({
      data: {
        id: brand.id,
        name: brand.name,
        createdAt: new Date(brand.created_at || Date.now())
      }
    });
  }
  console.log(`Imported ${brands.length} brands`);
}

async function importRules(db: sqlite3.Database) {
  console.log('Importing rules...');
  const rules = await queryOldDb(db, 'SELECT * FROM rules');
  
  for (const rule of rules) {
    await prisma.rule.create({
      data: {
        id: rule.id,
        platform: rule.platform,
        title: rule.title,
        description: rule.description,
        category: rule.category,
        status: rule.status || 'active',
        priority: rule.priority || 'medium',
        createdAt: new Date(rule.created_at || Date.now()),
        updatedAt: new Date(rule.updated_at || Date.now())
      }
    });
  }
  console.log(`Imported ${rules.length} rules`);
}

async function importScores(db: sqlite3.Database) {
  console.log('Importing scores...');
  const scores = await queryOldDb(db, 'SELECT * FROM scores');
  
  for (const score of scores) {
    await prisma.score.create({
      data: {
        id: score.id,
        ruleId: score.rule_id,
        platform: score.platform,
        countryId: score.country_id,
        brandId: score.brand_id,
        score: score.score,
        trend: score.trend || 0,
        month: score.month,
        evaluation: score.evaluation || 'NA',
        createdAt: new Date(score.created_at || Date.now()),
        updatedAt: new Date(score.updated_at || Date.now())
      }
    });
  }
  console.log(`Imported ${scores.length} scores`);
}

async function importChangeRequests(db: sqlite3.Database) {
  console.log('Importing change requests...');
  const changeRequests = await queryOldDb(db, 'SELECT * FROM change_requests');
  
  for (const request of changeRequests) {
    await prisma.changeRequest.create({
      data: {
        id: request.id,
        scoreId: request.score_id,
        requestedScore: request.requested_score,
        comments: request.comments,
        status: request.status || 'Submitted for Review',
        createdAt: new Date(request.created_at || Date.now()),
        updatedAt: new Date(request.updated_at || Date.now())
      }
    });
  }
  console.log(`Imported ${changeRequests.length} change requests`);
}

async function main() {
  try {
    console.log('Starting data import...');
    
    // Check if old database exists
    if (!fs.existsSync(oldDbPath)) {
      console.error(`Old database not found at ${oldDbPath}`);
      return;
    }
    
    const db = await connectToOldDb();
    
    // Import data in the correct order to maintain relationships
    await importRegions(db);
    await importCountries(db);
    await importBrands(db);
    await importRules(db);
    await importScores(db);
    await importChangeRequests(db);
    
    console.log('Data import completed successfully!');
    
    // Close connections
    db.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error importing data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
