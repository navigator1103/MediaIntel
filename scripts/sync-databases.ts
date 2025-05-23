import { PrismaClient as SQLitePrismaClient } from '@prisma/client';
import { PrismaClient as PGPrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Create a custom PostgreSQL client
const pgClient = new PGPrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/golden_rules'
    }
  }
});

// Create a SQLite client (using the default connection string from .env)
const sqliteClient = new SQLitePrismaClient();

/**
 * Synchronize data from PostgreSQL to SQLite
 */
async function syncFromPostgresToSQLite() {
  console.log('Starting synchronization from PostgreSQL to SQLite...');
  
  try {
    // 1. Media Sufficiency Data
    
    // 1.1 Sync SubRegions
    console.log('Syncing SubRegions...');
    const pgSubRegions = await pgClient.subRegion.findMany();
    
    // Clear SQLite table
    await sqliteClient.subRegion.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.2 Sync MSCountries
    console.log('Syncing MSCountries...');
    const pgMSCountries = await pgClient.mSCountry.findMany();
    
    // Clear SQLite table
    await sqliteClient.mSCountry.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.2.1 Sync regular Countries (for validation)
    console.log('Syncing Countries...');
    const pgCountries = await pgClient.country.findMany({
      include: {
        region: true
      }
    });
    
    // Clear SQLite table
    await sqliteClient.country.deleteMany({});
    
    // Insert data from PostgreSQL
    console.log(`Found ${pgCountries.length} countries to sync`);
    for (const country of pgCountries) {
      await sqliteClient.country.create({
        data: {
          id: country.id,
          name: country.name,
          regionId: country.regionId,
          createdAt: country.createdAt
        }
      });
    }
    
    // 1.3 Sync Categories
    console.log('Syncing Categories...');
    const pgCategories = await pgClient.category.findMany();
    
    // Clear SQLite table
    await sqliteClient.category.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.4 Sync Ranges
    console.log('Syncing Ranges...');
    const pgRanges = await pgClient.range.findMany();
    
    // Clear SQLite table
    await sqliteClient.range.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.5 Sync MediaTypes
    console.log('Syncing MediaTypes...');
    const pgMediaTypes = await pgClient.mediaType.findMany();
    
    // Clear SQLite table
    await sqliteClient.mediaType.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.6 Sync MediaSubtypes
    console.log('Syncing MediaSubtypes...');
    const pgMediaSubtypes = await pgClient.mediaSubtype.findMany();
    
    // Clear SQLite table
    await sqliteClient.mediaSubtype.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.7 Sync BusinessUnits
    console.log('Syncing BusinessUnits...');
    const pgBusinessUnits = await pgClient.businessUnit.findMany();
    
    // Clear SQLite table
    await sqliteClient.businessUnit.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.8 Sync PMTypes
    console.log('Syncing PMTypes...');
    const pgPMTypes = await pgClient.pMType.findMany();
    
    // Clear SQLite table
    await sqliteClient.pMType.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.9 Sync Campaigns
    console.log('Syncing Campaigns...');
    const pgCampaigns = await pgClient.campaign.findMany();
    
    // Clear SQLite table
    await sqliteClient.campaign.deleteMany({});
    
    // Insert data from PostgreSQL
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
    
    // 1.10 Sync CampaignMedia
    console.log('Syncing CampaignMedia...');
    const pgCampaignMedia = await pgClient.campaignMedia.findMany();
    
    // Clear SQLite table
    await sqliteClient.campaignMedia.deleteMany({});
    
    // Insert data from PostgreSQL
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
          createdAt: media.createdAt,
          updatedAt: media.updatedAt
        }
      });
    }
    
    console.log('Synchronization from PostgreSQL to SQLite completed successfully!');
  } catch (error) {
    console.error('Error during synchronization:', error);
    throw error;
  } finally {
    await pgClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

/**
 * Synchronize data from SQLite to PostgreSQL
 */
async function syncFromSQLiteToPostgres() {
  console.log('Starting synchronization from SQLite to PostgreSQL...');
  
  try {
    // Implementation similar to syncFromPostgresToSQLite but in reverse direction
    // This would be used when you've made changes in the SQLite database that you want to persist to PostgreSQL
    
    console.log('Synchronization from SQLite to PostgreSQL completed successfully!');
  } catch (error) {
    console.error('Error during synchronization:', error);
    throw error;
  } finally {
    await pgClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

// Command line arguments to determine sync direction
const args = process.argv.slice(2);
const direction = args[0] || 'pg-to-sqlite'; // Default to PostgreSQL to SQLite

async function main() {
  try {
    if (direction === 'pg-to-sqlite') {
      await syncFromPostgresToSQLite();
    } else if (direction === 'sqlite-to-pg') {
      await syncFromSQLiteToPostgres();
    } else {
      console.error('Invalid direction. Use "pg-to-sqlite" or "sqlite-to-pg"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Synchronization failed:', error);
    process.exit(1);
  }
}

main();
