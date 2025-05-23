import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Current list of countries we want to use
const currentCountries = [
  { id: 1, name: 'Brazil', regionId: 1 },
  { id: 2, name: 'India', regionId: 2 },
  { id: 3, name: 'South Africa', regionId: 3 },
  { id: 4, name: 'Australia', regionId: 2 },
  { id: 5, name: 'Chile', regionId: 1 },
  { id: 6, name: 'Thailand', regionId: 2 },
  { id: 7, name: 'Indonesia', regionId: 2 },
  { id: 8, name: 'Malaysia', regionId: 2 }
];

// GET /api/admin/countries - Get all countries
export async function GET(request) {
  try {
    // First, ensure our database has the current countries
    await updateCountriesInDatabase();
    
    // Then fetch all countries
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        regionId: true,
        region: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(countries, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      },
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}

// Helper function to update countries in the database
async function updateCountriesInDatabase(forceUpdate = false) {
  try {
    console.log(`Updating countries in database... (forceUpdate: ${forceUpdate})`);
    
    // If forceUpdate is true, perform a complete cleanup of countries
    if (forceUpdate) {
      console.log('FORCE UPDATE: Performing complete cleanup of countries');
      
      try {
        // Delete all scores first to avoid foreign key constraints
        const deletedScores = await prisma.score.deleteMany({
          where: {
            countryId: {
              notIn: currentCountries.map(c => c.id)
            }
          }
        });
        console.log(`Deleted ${deletedScores.count} scores associated with old countries`);
        
        // Delete all five stars ratings for old countries
        const deletedRatings = await prisma.fiveStarsRating.deleteMany({
          where: {
            countryId: {
              notIn: currentCountries.map(c => c.id)
            }
          }
        });
        console.log(`Deleted ${deletedRatings.count} five stars ratings associated with old countries`);
        
        // Delete all countries that are not in our current list
        const deletedCountries = await prisma.country.deleteMany({
          where: {
            id: {
              notIn: currentCountries.map(c => c.id)
            }
          }
        });
        console.log(`Deleted ${deletedCountries.count} old countries`);
      } catch (err) {
        console.error('Error during force cleanup:', err);
      }
    }
    
    // Ensure regions exist
    const regions = [
      { id: 1, name: 'Americas' },
      { id: 2, name: 'Asia Pacific' },
      { id: 3, name: 'Africa' },
    ];
    
    // Upsert regions
    for (const region of regions) {
      await prisma.region.upsert({
        where: { id: region.id },
        update: { name: region.name },
        create: { id: region.id, name: region.name },
      });
    }
    
    // Get all existing countries after potential cleanup
    const existingCountries = await prisma.country.findMany();
    console.log(`Found ${existingCountries.length} existing countries in database`);
    
    // Explicitly delete old countries by name
    console.log('Explicitly removing old countries by name:', oldCountriesToRemove);
    for (const countryName of oldCountriesToRemove) {
      try {
        // Find countries with this name
        const countriesToDelete = await prisma.country.findMany({
          where: { name: countryName }
        });
        
        for (const country of countriesToDelete) {
          console.log(`Deleting old country by name: ${country.name} (ID: ${country.id})`);
          
          // Delete any scores associated with this country
          const deletedScores = await prisma.score.deleteMany({
            where: { countryId: country.id }
          });
          console.log(`Deleted ${deletedScores.count} scores for ${country.name}`);
          
          // Delete any five stars ratings associated with this country
          const deletedRatings = await prisma.fiveStarsRating.deleteMany({
            where: { countryId: country.id }
          });
          console.log(`Deleted ${deletedRatings.count} ratings for ${country.name}`);
          
          // Delete the country
          await prisma.country.delete({
            where: { id: country.id }
          });
          console.log(`Successfully deleted ${country.name}`);
        }
      } catch (err) {
        console.error(`Error deleting country ${countryName}:`, err);
      }
    }
    
    // Delete countries that are not in the current list (as a backup to the force update)
    const currentCountryIds = currentCountries.map(c => c.id);
    const remainingCountries = await prisma.country.findMany();
    for (const country of remainingCountries) {
      if (!currentCountryIds.includes(country.id)) {
        console.log(`Deleting old country by ID: ${country.name} (ID: ${country.id})`);
        try {
          // Delete any scores associated with this country
          await prisma.score.deleteMany({
            where: { countryId: country.id }
          });
          
          // Delete any five stars ratings associated with this country
          await prisma.fiveStarsRating.deleteMany({
            where: { countryId: country.id }
          });
          
          // Delete the country
          await prisma.country.delete({
            where: { id: country.id }
          });
        } catch (err) {
          console.error(`Error deleting country ${country.name}:`, err);
        }
      }
    }
    
    // Upsert current countries
    for (const country of currentCountries) {
      await prisma.country.upsert({
        where: { id: country.id },
        update: { name: country.name, regionId: country.regionId },
        create: { id: country.id, name: country.name, regionId: country.regionId },
      });
    }
    
    console.log('Countries updated successfully');
  } catch (error) {
    console.error('Error updating countries:', error);
  }
}

// POST /api/admin/countries - Create a new country
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.regionId) {
      return NextResponse.json(
        { error: 'Name and regionId are required' },
        { status: 400 }
      );
    }
    
    // Check if the region exists
    const region = await prisma.region.findUnique({
      where: { id: body.regionId }
    });
    
    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }
    
    // Create the country
    const country = await prisma.country.create({
      data: {
        name: body.name,
        regionId: body.regionId
      },
      include: {
        region: true
      }
    });
    
    return NextResponse.json(country, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json(
      { error: 'Failed to create country', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
