import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getValidValues() {
  try {
    const ranges = await prisma.range.findMany({
      where: { status: { not: 'archived' } },
      select: { name: true },
      take: 5
    });
    
    const campaigns = await prisma.campaign.findMany({
      where: { status: { not: 'archived' } },
      select: { name: true },
      take: 3
    });
    
    const categories = await prisma.category.findMany({
      select: { name: true },
      take: 5
    });
    
    const mediaSubtypes = await prisma.mediaSubType.findMany({
      select: { name: true },
      take: 8
    });
    
    const pmTypes = await prisma.pMType.findMany({
      select: { name: true },
      take: 5
    });
    
    const archetypes = await prisma.campaignArchetype.findMany({
      select: { name: true },
      take: 5
    });
    
    console.log('RANGES:', ranges.map(r => r.name).join(', '));
    console.log('CAMPAIGNS:', campaigns.map(c => c.name).join(', '));
    console.log('CATEGORIES:', categories.map(c => c.name).join(', '));
    console.log('MEDIA_SUBTYPES:', mediaSubtypes.map(ms => ms.name).join(', '));
    console.log('PM_TYPES:', pmTypes.map(pt => pt.name).join(', '));
    console.log('ARCHETYPES:', archetypes.map(a => a.name).join(', '));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getValidValues();