import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Get the current username for PostgreSQL connection
const username = execSync('whoami').toString().trim();

// Create a SQLite client (using the default connection string from .env)
const sqliteClient = new PrismaClient();

/**
 * Export SQLite data to a SQL file that can be imported into PostgreSQL
 */
async function exportToSql() {
  console.log('Starting export from SQLite to SQL file...');
  
  try {
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sqlFilePath = path.join(exportDir, `media-sufficiency-export-${timestamp}.sql`);
    
    // Open file for writing
    const sqlFile = fs.createWriteStream(sqlFilePath);
    
    // Write SQL header
    sqlFile.write('-- Media Sufficiency Data Export\n');
    sqlFile.write(`-- Generated: ${new Date().toISOString()}\n\n`);
    
    // PostgreSQL setup
    sqlFile.write('-- PostgreSQL setup\n');
    sqlFile.write('BEGIN;\n\n');
    
    // Create tables
    sqlFile.write('-- Create tables\n');
    
    // SubRegion table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_sub_regions" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);

`);
    
    // MSCountry table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_countries" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "sub_region_id" INTEGER NOT NULL,
  "cluster" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("sub_region_id") REFERENCES "ms_sub_regions"("id")
);

`);
    
    // Category table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);

`);
    
    // Range table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_ranges" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("category_id") REFERENCES "ms_categories"("id"),
  UNIQUE("name", "category_id")
);

`);
    
    // MediaType table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_media_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);

`);
    
    // MediaSubtype table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_media_subtypes" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "media_type_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("media_type_id") REFERENCES "ms_media_types"("id"),
  UNIQUE("name", "media_type_id")
);

`);
    
    // BusinessUnit table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_business_units" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);

`);
    
    // PMType table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_pm_types" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL
);

`);
    
    // Campaign table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_campaigns" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "country_id" INTEGER NOT NULL,
  "range_id" INTEGER NOT NULL,
  "business_unit_id" INTEGER,
  "playback_id" TEXT,
  "burst" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("country_id") REFERENCES "ms_countries"("id"),
  FOREIGN KEY ("range_id") REFERENCES "ms_ranges"("id"),
  FOREIGN KEY ("business_unit_id") REFERENCES "ms_business_units"("id")
);

`);
    
    // CampaignMedia table
    sqlFile.write(`
CREATE TABLE IF NOT EXISTS "ms_campaign_media" (
  "id" SERIAL PRIMARY KEY,
  "campaign_id" INTEGER NOT NULL,
  "media_subtype_id" INTEGER NOT NULL,
  "pm_type_id" INTEGER,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "total_budget" DOUBLE PRECISION NOT NULL,
  "q1_budget" DOUBLE PRECISION,
  "q2_budget" DOUBLE PRECISION,
  "q3_budget" DOUBLE PRECISION,
  "q4_budget" DOUBLE PRECISION,
  "trps" DOUBLE PRECISION,
  "reach_1_plus" DOUBLE PRECISION,
  "reach_3_plus" DOUBLE PRECISION,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL,
  FOREIGN KEY ("campaign_id") REFERENCES "ms_campaigns"("id"),
  FOREIGN KEY ("media_subtype_id") REFERENCES "ms_media_subtypes"("id"),
  FOREIGN KEY ("pm_type_id") REFERENCES "ms_pm_types"("id")
);

`);
    
    // Now export data
    
    // 1. Export SubRegions
    console.log('Exporting SubRegions...');
    const subRegions = await sqliteClient.subRegion.findMany();
    
    sqlFile.write('-- SubRegion data\n');
    for (const subRegion of subRegions) {
      sqlFile.write(`INSERT INTO "ms_sub_regions" ("id", "name", "created_at", "updated_at") 
VALUES (${subRegion.id}, '${subRegion.name.replace(/'/g, "''")}', '${subRegion.createdAt.toISOString()}', '${subRegion.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 2. Export MSCountries
    console.log('Exporting MSCountries...');
    const msCountries = await sqliteClient.mSCountry.findMany();
    
    sqlFile.write('-- MSCountry data\n');
    for (const country of msCountries) {
      sqlFile.write(`INSERT INTO "ms_countries" ("id", "name", "sub_region_id", "cluster", "created_at", "updated_at") 
VALUES (${country.id}, '${country.name.replace(/'/g, "''")}', ${country.subRegionId}, ${country.cluster ? `'${country.cluster.replace(/'/g, "''")}'` : 'NULL'}, '${country.createdAt.toISOString()}', '${country.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sub_region_id = EXCLUDED.sub_region_id,
  cluster = EXCLUDED.cluster,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 3. Export Categories
    console.log('Exporting Categories...');
    const categories = await sqliteClient.category.findMany();
    
    sqlFile.write('-- Category data\n');
    for (const category of categories) {
      sqlFile.write(`INSERT INTO "ms_categories" ("id", "name", "created_at", "updated_at") 
VALUES (${category.id}, '${category.name.replace(/'/g, "''")}', '${category.createdAt.toISOString()}', '${category.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 4. Export Ranges
    console.log('Exporting Ranges...');
    const ranges = await sqliteClient.range.findMany();
    
    sqlFile.write('-- Range data\n');
    for (const range of ranges) {
      sqlFile.write(`INSERT INTO "ms_ranges" ("id", "name", "category_id", "created_at", "updated_at") 
VALUES (${range.id}, '${range.name.replace(/'/g, "''")}', ${range.categoryId}, '${range.createdAt.toISOString()}', '${range.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 5. Export MediaTypes
    console.log('Exporting MediaTypes...');
    const mediaTypes = await sqliteClient.mediaType.findMany();
    
    sqlFile.write('-- MediaType data\n');
    for (const mediaType of mediaTypes) {
      sqlFile.write(`INSERT INTO "ms_media_types" ("id", "name", "created_at", "updated_at") 
VALUES (${mediaType.id}, '${mediaType.name.replace(/'/g, "''")}', '${mediaType.createdAt.toISOString()}', '${mediaType.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 6. Export MediaSubtypes
    console.log('Exporting MediaSubtypes...');
    const mediaSubtypes = await sqliteClient.mediaSubtype.findMany();
    
    sqlFile.write('-- MediaSubtype data\n');
    for (const mediaSubtype of mediaSubtypes) {
      sqlFile.write(`INSERT INTO "ms_media_subtypes" ("id", "name", "media_type_id", "created_at", "updated_at") 
VALUES (${mediaSubtype.id}, '${mediaSubtype.name.replace(/'/g, "''")}', ${mediaSubtype.mediaTypeId}, '${mediaSubtype.createdAt.toISOString()}', '${mediaSubtype.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  media_type_id = EXCLUDED.media_type_id,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 7. Export BusinessUnits
    console.log('Exporting BusinessUnits...');
    const businessUnits = await sqliteClient.businessUnit.findMany();
    
    sqlFile.write('-- BusinessUnit data\n');
    for (const businessUnit of businessUnits) {
      sqlFile.write(`INSERT INTO "ms_business_units" ("id", "name", "created_at", "updated_at") 
VALUES (${businessUnit.id}, '${businessUnit.name.replace(/'/g, "''")}', '${businessUnit.createdAt.toISOString()}', '${businessUnit.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 8. Export PMTypes
    console.log('Exporting PMTypes...');
    const pmTypes = await sqliteClient.pMType.findMany();
    
    sqlFile.write('-- PMType data\n');
    for (const pmType of pmTypes) {
      sqlFile.write(`INSERT INTO "ms_pm_types" ("id", "name", "created_at", "updated_at") 
VALUES (${pmType.id}, '${pmType.name.replace(/'/g, "''")}', '${pmType.createdAt.toISOString()}', '${pmType.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 9. Export Campaigns
    console.log('Exporting Campaigns...');
    const campaigns = await sqliteClient.campaign.findMany();
    
    sqlFile.write('-- Campaign data\n');
    for (const campaign of campaigns) {
      sqlFile.write(`INSERT INTO "ms_campaigns" ("id", "name", "year", "country_id", "range_id", "business_unit_id", "playback_id", "burst", "created_at", "updated_at") 
VALUES (${campaign.id}, '${campaign.name.replace(/'/g, "''")}', ${campaign.year}, ${campaign.countryId}, ${campaign.rangeId}, ${campaign.businessUnitId || 'NULL'}, ${campaign.playbackId ? `'${campaign.playbackId.replace(/'/g, "''")}'` : 'NULL'}, ${campaign.burst}, '${campaign.createdAt.toISOString()}', '${campaign.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  year = EXCLUDED.year,
  country_id = EXCLUDED.country_id,
  range_id = EXCLUDED.range_id,
  business_unit_id = EXCLUDED.business_unit_id,
  playback_id = EXCLUDED.playback_id,
  burst = EXCLUDED.burst,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // 10. Export CampaignMedia
    console.log('Exporting CampaignMedia...');
    const campaignMedia = await sqliteClient.campaignMedia.findMany();
    
    sqlFile.write('-- CampaignMedia data\n');
    for (const media of campaignMedia) {
      sqlFile.write(`INSERT INTO "ms_campaign_media" ("id", "campaign_id", "media_subtype_id", "pm_type_id", "start_date", "end_date", "total_budget", "q1_budget", "q2_budget", "q3_budget", "q4_budget", "trps", "reach_1_plus", "reach_3_plus", "created_at", "updated_at") 
VALUES (${media.id}, ${media.campaignId}, ${media.mediaSubtypeId}, ${media.pmTypeId || 'NULL'}, '${media.startDate.toISOString()}', '${media.endDate.toISOString()}', ${media.totalBudget}, ${media.q1Budget || 'NULL'}, ${media.q2Budget || 'NULL'}, ${media.q3Budget || 'NULL'}, ${media.q4Budget || 'NULL'}, ${media.trps || 'NULL'}, ${media.reach1Plus || 'NULL'}, ${media.reach3Plus || 'NULL'}, '${media.createdAt.toISOString()}', '${media.updatedAt.toISOString()}')
ON CONFLICT (id) DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  media_subtype_id = EXCLUDED.media_subtype_id,
  pm_type_id = EXCLUDED.pm_type_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_budget = EXCLUDED.total_budget,
  q1_budget = EXCLUDED.q1_budget,
  q2_budget = EXCLUDED.q2_budget,
  q3_budget = EXCLUDED.q3_budget,
  q4_budget = EXCLUDED.q4_budget,
  trps = EXCLUDED.trps,
  reach_1_plus = EXCLUDED.reach_1_plus,
  reach_3_plus = EXCLUDED.reach_3_plus,
  updated_at = EXCLUDED.updated_at;\n`);
    }
    sqlFile.write('\n');
    
    // Commit transaction
    sqlFile.write('COMMIT;\n');
    
    // Close file
    sqlFile.end();
    
    console.log(`Export completed successfully! SQL file saved to: ${sqlFilePath}`);
    console.log('\nTo import this data into PostgreSQL, run:');
    console.log(`psql -U ${username} -d golden_rules -f "${sqlFilePath}"`);
    
    return sqlFilePath;
  } catch (error) {
    console.error('Error during export:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
  }
}

/**
 * Import SQL file into PostgreSQL
 */
async function importToPostgres(sqlFilePath: string) {
  console.log(`Importing SQL file to PostgreSQL: ${sqlFilePath}`);
  
  try {
    // Check if PostgreSQL database exists, create if not
    try {
      execSync(`psql -U ${username} -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'golden_rules'"`, { stdio: 'pipe' });
    } catch (error) {
      console.log('Creating PostgreSQL database...');
      try {
        execSync(`createdb -U ${username} golden_rules`, { stdio: 'inherit' });
        console.log('PostgreSQL database created successfully');
      } catch (createError) {
        console.log('Database may already exist, continuing...');
      }
    }
    
    // Import SQL file
    console.log('Importing data...');
    execSync(`psql -U ${username} -d golden_rules -f "${sqlFilePath}"`, { stdio: 'inherit' });
    
    console.log('Import to PostgreSQL completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  }
}

/**
 * Restore data from PostgreSQL to SQLite
 */
async function restoreFromPostgres() {
  console.log('This functionality is not implemented yet.');
  console.log('To restore data, please use the SQL export file to manually import into PostgreSQL,');
  console.log('and then use the update-media-sufficiency.ts script to import data from CSV.');
}

// Command line arguments to determine operation
const args = process.argv.slice(2);
const operation = args[0] || 'export'; // Default to export

async function main() {
  try {
    if (operation === 'export') {
      const sqlFilePath = await exportToSql();
      
      // Ask if user wants to import to PostgreSQL
      console.log('\nDo you want to import this data into PostgreSQL now? (y/n)');
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
          await importToPostgres(sqlFilePath);
        } else {
          console.log('Skipping import to PostgreSQL.');
        }
        process.exit(0);
      });
    } else if (operation === 'import') {
      if (args[1]) {
        await importToPostgres(args[1]);
      } else {
        console.error('Please specify the SQL file to import');
        process.exit(1);
      }
    } else if (operation === 'restore') {
      await restoreFromPostgres();
    } else {
      console.error('Invalid operation. Use "export", "import", or "restore"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
}

// Only call main if this script is run directly
if (require.main === module) {
  main();
}
