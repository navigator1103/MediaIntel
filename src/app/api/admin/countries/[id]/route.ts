import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/countries/[id] - Delete a country by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const countryId = parseInt(id);
    
    if (isNaN(countryId)) {
      return NextResponse.json(
        { error: 'Invalid country ID' },
        { status: 400 }
      );
    }
    
    // Check if the country exists
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    });
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }
    
    // Delete any scores associated with this country
    const deletedScores = await prisma.score.deleteMany({
      where: { countryId }
    });
    console.log(`Deleted ${deletedScores.count} scores for country ${country.name}`);
    
    // Delete any five stars ratings associated with this country
    const deletedRatings = await prisma.fiveStarsRating.deleteMany({
      where: { countryId }
    });
    console.log(`Deleted ${deletedRatings.count} ratings for country ${country.name}`);
    
    // Delete the country
    await prisma.country.delete({
      where: { id: countryId }
    });
    
    return NextResponse.json(
      { message: `Country "${country.name}" deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting country:', error);
    return NextResponse.json(
      { error: 'Failed to delete country', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
