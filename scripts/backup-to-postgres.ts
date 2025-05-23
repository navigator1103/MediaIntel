import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Get the current username for PostgreSQL connection
const username = execSync('whoami').toString().trim();

// Create a custom PostgreSQL connection string
const pgConnectionString = `postgresql://${username}@localhost:5432/golden_rules`;

// Create a custom PostgreSQL client
const pgClient = new PrismaClient({
  datasources: {
    db: {
      url: pgConnectionString
    }
  }
});

// Create a SQLite client (using the default connection string from .env)
const sqliteClient = new PrismaClient();

/**
 * Backup SQLite data to PostgreSQL
 */
async function backupToPostgres() {
  console.log('Starting backup from SQLite to PostgreSQL...');
  
  try {
    // Check if PostgreSQL database exists, create if not
    try {
      await pgClient.$queryRaw`SELECT 1`;
      console.log('PostgreSQL database connection successful');
    } catch (error) {
      console.log('Creating PostgreSQL database...');
      try {
        execSync(`createdb -U ${username} golden_rules`, { stdio: 'inherit' });
        console.log('PostgreSQL database created successfully');
      } catch (createError) {
        console.log('Database may already exist, continuing...');
      }
    }
    
    // Create tables in PostgreSQL if they don't exist
    console.log('Creating tables in PostgreSQL if they don\'t exist...');
    
    // SubRegion table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_sub_regions" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL
        )
      `;
    } catch (error) {
      console.log('SubRegion table may already exist');
    }
    
    // MSCountry table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_countries" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "sub_region_id" INTEGER NOT NULL,
          "cluster" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("sub_region_id") REFERENCES "ms_sub_regions"("id")
        )
      `;
    } catch (error) {
      console.log('MSCountry table may already exist');
    }
    
    // Category table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_categories" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL
        )
      `;
    } catch (error) {
      console.log('Category table may already exist');
    }
    
    // Range table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_ranges" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "category_id" INTEGER NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("category_id") REFERENCES "ms_categories"("id"),
          UNIQUE("name", "category_id")
        )
      `;
    } catch (error) {
      console.log('Range table may already exist');
    }
    
    // MediaType table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_media_types" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL
        )
      `;
    } catch (error) {
      console.log('MediaType table may already exist');
    }
    
    // MediaSubtype table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_media_subtypes" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "media_type_id" INTEGER NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("media_type_id") REFERENCES "ms_media_types"("id"),
          UNIQUE("name", "media_type_id")
        )
      `;
    } catch (error) {
      console.log('MediaSubtype table may already exist');
    }
    
    // BusinessUnit table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_business_units" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL
        )
      `;
    } catch (error) {
      console.log('BusinessUnit table may already exist');
    }
    
    // PMType table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_pm_types" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT UNIQUE NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL
        )
      `;
    } catch (error) {
      console.log('PMType table may already exist');
    }
    
    // Campaign table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_campaigns" (
          "id" SERIAL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "year" INTEGER NOT NULL,
          "country_id" INTEGER NOT NULL,
          "range_id" INTEGER NOT NULL,
          "business_unit_id" INTEGER,
          "playback_id" TEXT,
          "burst" INTEGER NOT NULL DEFAULT 1,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("country_id") REFERENCES "ms_countries"("id"),
          FOREIGN KEY ("range_id") REFERENCES "ms_ranges"("id"),
          FOREIGN KEY ("business_unit_id") REFERENCES "ms_business_units"("id")
        )
      `;
    } catch (error) {
      console.log('Campaign table may already exist');
    }
    
    // CampaignMedia table
    try {
      await pgClient.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ms_campaign_media" (
          "id" SERIAL PRIMARY KEY,
          "campaign_id" INTEGER NOT NULL,
          "media_subtype_id" INTEGER NOT NULL,
          "pm_type_id" INTEGER,
          "start_date" TIMESTAMP(3) NOT NULL,
          "end_date" TIMESTAMP(3) NOT NULL,
          "total_budget" DOUBLE PRECISION NOT NULL,
          "q1_budget" DOUBLE PRECISION,
          "q2_budget" DOUBLE PRECISION,
          "q3_budget" DOUBLE PRECISION,
          "q4_budget" DOUBLE PRECISION,
          "trps" DOUBLE PRECISION,
          "reach_1_plus" DOUBLE PRECISION,
          "reach_3_plus" DOUBLE PRECISION,
          -- Note: target_reach and current_reach fields removed as they don't exist in the schema
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("campaign_id") REFERENCES "ms_campaigns"("id"),
          FOREIGN KEY ("media_subtype_id") REFERENCES "ms_media_subtypes"("id"),
          FOREIGN KEY ("pm_type_id") REFERENCES "ms_pm_types"("id")
        )
      `;
    } catch (error) {
      console.log('CampaignMedia table may already exist');
    }
    
    // Now backup data from SQLite to PostgreSQL
    
    // 1. Backup SubRegions
    console.log('Backing up SubRegions...');
    const subRegions = await sqliteClient.subRegion.findMany();
    
    for (const subRegion of subRegions) {
      try {
        await pgClient.subRegion.upsert({
          where: { id: subRegion.id },
          update: {
            name: subRegion.name,
            updatedAt: subRegion.updatedAt
          },
          create: {
            id: subRegion.id,
            name: subRegion.name,
            createdAt: subRegion.createdAt,
            updatedAt: subRegion.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up SubRegion ${subRegion.id}:`, error);
      }
    }
    
    // 2. Backup MSCountries
    console.log('Backing up MSCountries...');
    const msCountries = await sqliteClient.mSCountry.findMany();
    
    for (const country of msCountries) {
      try {
        await pgClient.mSCountry.upsert({
          where: { id: country.id },
          update: {
            name: country.name,
            subRegionId: country.subRegionId,
            cluster: country.cluster,
            updatedAt: country.updatedAt
          },
          create: {
            id: country.id,
            name: country.name,
            subRegionId: country.subRegionId,
            cluster: country.cluster,
            createdAt: country.createdAt,
            updatedAt: country.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up MSCountry ${country.id}:`, error);
      }
    }
    
    // 3. Backup Categories
    console.log('Backing up Categories...');
    const categories = await sqliteClient.category.findMany();
    
    for (const category of categories) {
      try {
        await pgClient.category.upsert({
          where: { id: category.id },
          update: {
            name: category.name,
            updatedAt: category.updatedAt
          },
          create: {
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up Category ${category.id}:`, error);
      }
    }
    
    // 4. Backup Ranges
    console.log('Backing up Ranges...');
    const ranges = await sqliteClient.range.findMany();
    
    for (const range of ranges) {
      try {
        await pgClient.range.upsert({
          where: { id: range.id },
          update: {
            name: range.name,
            categoryId: range.categoryId,
            updatedAt: range.updatedAt
          },
          create: {
            id: range.id,
            name: range.name,
            categoryId: range.categoryId,
            createdAt: range.createdAt,
            updatedAt: range.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up Range ${range.id}:`, error);
      }
    }
    
    // 5. Backup MediaTypes
    console.log('Backing up MediaTypes...');
    const mediaTypes = await sqliteClient.mediaType.findMany();
    
    for (const mediaType of mediaTypes) {
      try {
        await pgClient.mediaType.upsert({
          where: { id: mediaType.id },
          update: {
            name: mediaType.name,
            updatedAt: mediaType.updatedAt
          },
          create: {
            id: mediaType.id,
            name: mediaType.name,
            createdAt: mediaType.createdAt,
            updatedAt: mediaType.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up MediaType ${mediaType.id}:`, error);
      }
    }
    
    // 6. Backup MediaSubtypes
    console.log('Backing up MediaSubtypes...');
    const mediaSubtypes = await sqliteClient.mediaSubtype.findMany();
    
    for (const mediaSubtype of mediaSubtypes) {
      try {
        await pgClient.mediaSubtype.upsert({
          where: { id: mediaSubtype.id },
          update: {
            name: mediaSubtype.name,
            mediaTypeId: mediaSubtype.mediaTypeId,
            updatedAt: mediaSubtype.updatedAt
          },
          create: {
            id: mediaSubtype.id,
            name: mediaSubtype.name,
            mediaTypeId: mediaSubtype.mediaTypeId,
            createdAt: mediaSubtype.createdAt,
            updatedAt: mediaSubtype.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up MediaSubtype ${mediaSubtype.id}:`, error);
      }
    }
    
    // 7. Backup BusinessUnits
    console.log('Backing up BusinessUnits...');
    const businessUnits = await sqliteClient.businessUnit.findMany();
    
    for (const businessUnit of businessUnits) {
      try {
        await pgClient.businessUnit.upsert({
          where: { id: businessUnit.id },
          update: {
            name: businessUnit.name,
            updatedAt: businessUnit.updatedAt
          },
          create: {
            id: businessUnit.id,
            name: businessUnit.name,
            createdAt: businessUnit.createdAt,
            updatedAt: businessUnit.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up BusinessUnit ${businessUnit.id}:`, error);
      }
    }
    
    // 8. Backup PMTypes
    console.log('Backing up PMTypes...');
    const pmTypes = await sqliteClient.pMType.findMany();
    
    for (const pmType of pmTypes) {
      try {
        await pgClient.pMType.upsert({
          where: { id: pmType.id },
          update: {
            name: pmType.name,
            updatedAt: pmType.updatedAt
          },
          create: {
            id: pmType.id,
            name: pmType.name,
            createdAt: pmType.createdAt,
            updatedAt: pmType.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up PMType ${pmType.id}:`, error);
      }
    }
    
    // 9. Backup Campaigns
    console.log('Backing up Campaigns...');
    const campaigns = await sqliteClient.campaign.findMany();
    
    for (const campaign of campaigns) {
      try {
        await pgClient.campaign.upsert({
          where: { id: campaign.id },
          update: {
            name: campaign.name,
            year: campaign.year,
            countryId: campaign.countryId,
            rangeId: campaign.rangeId,
            businessUnitId: campaign.businessUnitId,
            playbackId: campaign.playbackId,
            burst: campaign.burst,
            updatedAt: campaign.updatedAt
          },
          create: {
            id: campaign.id,
            name: campaign.name,
            year: campaign.year,
            countryId: campaign.countryId,
            rangeId: campaign.rangeId,
            businessUnitId: campaign.businessUnitId,
            playbackId: campaign.playbackId,
            burst: campaign.burst,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up Campaign ${campaign.id}:`, error);
      }
    }
    
    // 10. Backup CampaignMedia
    console.log('Backing up CampaignMedia...');
    const campaignMedia = await sqliteClient.campaignMedia.findMany();
    
    for (const media of campaignMedia) {
      try {
        await pgClient.campaignMedia.upsert({
          where: { id: media.id },
          update: {
            campaignId: media.campaignId,
            mediaSubtypeId: media.mediaSubtypeId,
            pmTypeId: media.pmTypeId,
            startDate: media.startDate,
            endDate: media.endDate,
            totalBudget: media.totalBudget,
            q1Budget: media.q1Budget,
            q2Budget: media.q2Budget,
            q3Budget: media.q3Budget,
            q4Budget: media.q4Budget,
            trps: media.trps,
            reach1Plus: media.reach1Plus,
            reach3Plus: media.reach3Plus,
            // Note: targetReach and currentReach fields removed as they don't exist in the schema
            updatedAt: media.updatedAt
          },
          create: {
            id: media.id,
            campaignId: media.campaignId,
            mediaSubtypeId: media.mediaSubtypeId,
            pmTypeId: media.pmTypeId,
            startDate: media.startDate,
            endDate: media.endDate,
            totalBudget: media.totalBudget,
            q1Budget: media.q1Budget,
            q2Budget: media.q2Budget,
            q3Budget: media.q3Budget,
            q4Budget: media.q4Budget,
            trps: media.trps,
            reach1Plus: media.reach1Plus,
            reach3Plus: media.reach3Plus,
            // Note: targetReach and currentReach fields removed as they don't exist in the schema
            createdAt: media.createdAt,
            updatedAt: media.updatedAt
          }
        });
      } catch (error) {
        console.error(`Error backing up CampaignMedia ${media.id}:`, error);
      }
    }
    
    console.log('Backup to PostgreSQL completed successfully!');
  } catch (error) {
    console.error('Error during backup:', error);
    throw error;
  } finally {
    await pgClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

/**
 * Restore data from PostgreSQL to SQLite
 */
async function restoreFromPostgres() {
  console.log('Starting restoration from PostgreSQL to SQLite...');
  
  try {
    // 1. Clear SQLite data
    console.log('Clearing existing SQLite data...');
    await sqliteClient.campaignMedia.deleteMany({});
    await sqliteClient.campaign.deleteMany({});
    await sqliteClient.pMType.deleteMany({});
    await sqliteClient.businessUnit.deleteMany({});
    await sqliteClient.mediaSubtype.deleteMany({});
    await sqliteClient.mediaType.deleteMany({});
    await sqliteClient.range.deleteMany({});
    await sqliteClient.category.deleteMany({});
    await sqliteClient.mSCountry.deleteMany({});
    await sqliteClient.subRegion.deleteMany({});
    
    // 2. Restore SubRegions
    console.log('Restoring SubRegions...');
    const pgSubRegions = await pgClient.subRegion.findMany();
    
    for (const subRegion of pgSubRegions) {
      await sqliteClient.subRegion.create({
        data: {
          id: subRegion.id,
          name: subRegion.name,
          createdAt: subRegion.createdAt,
          updatedAt: subRegion.updatedAt
        }
      });
    }
    
    // 3. Restore MSCountries
    console.log('Restoring MSCountries...');
    const pgMSCountries = await pgClient.mSCountry.findMany();
    
    for (const country of pgMSCountries) {
      await sqliteClient.mSCountry.create({
        data: {
          id: country.id,
          name: country.name,
          subRegionId: country.subRegionId,
          cluster: country.cluster,
          createdAt: country.createdAt,
          updatedAt: country.updatedAt
        }
      });
    }
    
    // 4. Restore Categories
    console.log('Restoring Categories...');
    const pgCategories = await pgClient.category.findMany();
    
    for (const category of pgCategories) {
      await sqliteClient.category.create({
        data: {
          id: category.id,
          name: category.name,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      });
    }
    
    // 5. Restore Ranges
    console.log('Restoring Ranges...');
    const pgRanges = await pgClient.range.findMany();
    
    for (const range of pgRanges) {
      await sqliteClient.range.create({
        data: {
          id: range.id,
          name: range.name,
          categoryId: range.categoryId,
          createdAt: range.createdAt,
          updatedAt: range.updatedAt
        }
      });
    }
    
    // 6. Restore MediaTypes
    console.log('Restoring MediaTypes...');
    const pgMediaTypes = await pgClient.mediaType.findMany();
    
    for (const mediaType of pgMediaTypes) {
      await sqliteClient.mediaType.create({
        data: {
          id: mediaType.id,
          name: mediaType.name,
          createdAt: mediaType.createdAt,
          updatedAt: mediaType.updatedAt
        }
      });
    }
    
    // 7. Restore MediaSubtypes
    console.log('Restoring MediaSubtypes...');
    const pgMediaSubtypes = await pgClient.mediaSubtype.findMany();
    
    for (const mediaSubtype of pgMediaSubtypes) {
      await sqliteClient.mediaSubtype.create({
        data: {
          id: mediaSubtype.id,
          name: mediaSubtype.name,
          mediaTypeId: mediaSubtype.mediaTypeId,
          createdAt: mediaSubtype.createdAt,
          updatedAt: mediaSubtype.updatedAt
        }
      });
    }
    
    // 8. Restore BusinessUnits
    console.log('Restoring BusinessUnits...');
    const pgBusinessUnits = await pgClient.businessUnit.findMany();
    
    for (const businessUnit of pgBusinessUnits) {
      await sqliteClient.businessUnit.create({
        data: {
          id: businessUnit.id,
          name: businessUnit.name,
          createdAt: businessUnit.createdAt,
          updatedAt: businessUnit.updatedAt
        }
      });
    }
    
    // 9. Restore PMTypes
    console.log('Restoring PMTypes...');
    const pgPMTypes = await pgClient.pMType.findMany();
    
    for (const pmType of pgPMTypes) {
      await sqliteClient.pMType.create({
        data: {
          id: pmType.id,
          name: pmType.name,
          createdAt: pmType.createdAt,
          updatedAt: pmType.updatedAt
        }
      });
    }
    
    // 10. Restore Campaigns
    console.log('Restoring Campaigns...');
    const pgCampaigns = await pgClient.campaign.findMany();
    
    for (const campaign of pgCampaigns) {
      await sqliteClient.campaign.create({
        data: {
          id: campaign.id,
          name: campaign.name,
          year: campaign.year,
          countryId: campaign.countryId,
          rangeId: campaign.rangeId,
          businessUnitId: campaign.businessUnitId,
          playbackId: campaign.playbackId,
          burst: campaign.burst,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt
        }
      });
    }
    
    // 11. Restore CampaignMedia
    console.log('Restoring CampaignMedia...');
    const pgCampaignMedia = await pgClient.campaignMedia.findMany();
    
    for (const media of pgCampaignMedia) {
      await sqliteClient.campaignMedia.create({
        data: {
          id: media.id,
          campaignId: media.campaignId,
          mediaSubtypeId: media.mediaSubtypeId,
          pmTypeId: media.pmTypeId,
          startDate: media.startDate,
          endDate: media.endDate,
          totalBudget: media.totalBudget,
          q1Budget: media.q1Budget,
          q2Budget: media.q2Budget,
          q3Budget: media.q3Budget,
          q4Budget: media.q4Budget,
          trps: media.trps,
          reach1Plus: media.reach1Plus,
          reach3Plus: media.reach3Plus,
          // Note: targetReach and currentReach fields removed as they don't exist in the schema
          createdAt: media.createdAt,
          updatedAt: media.updatedAt
        }
      });
    }
    
    console.log('Restoration from PostgreSQL completed successfully!');
  } catch (error) {
    console.error('Error during restoration:', error);
    throw error;
  } finally {
    await pgClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

// Command line arguments to determine operation
const args = process.argv.slice(2);
const operation = args[0] || 'backup'; // Default to backup

async function main() {
  try {
    if (operation === 'backup') {
      await backupToPostgres();
    } else if (operation === 'restore') {
      await restoreFromPostgres();
    } else {
      console.error('Invalid operation. Use "backup" or "restore"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
}

main();
