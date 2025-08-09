import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTvDemoValidation() {
  console.log('🧪 Testing TV Demographics Validation for Media Subtypes\n');
  
  // Get Traditional media subtypes
  const traditionalSubtypes = await prisma.mediaSubType.findMany({
    where: {
      mediaType: {
        name: 'Traditional'
      }
    },
    include: {
      mediaType: true
    }
  });
  
  console.log('Traditional Media Subtypes:');
  traditionalSubtypes.forEach(st => {
    console.log(`  - ${st.name}`);
  });
  console.log('');
  
  // Check game plans with different Traditional subtypes
  const gamePlansWithOpenTV = await prisma.gamePlan.findMany({
    where: {
      mediaSubType: {
        name: 'Open TV'
      }
    },
    take: 3,
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  const gamePlansWithPaidTV = await prisma.gamePlan.findMany({
    where: {
      mediaSubType: {
        name: 'Paid TV'
      }
    },
    take: 3,
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  const gamePlansWithOOH = await prisma.gamePlan.findMany({
    where: {
      mediaSubType: {
        name: 'OOH'
      }
    },
    take: 3,
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  const gamePlansWithPrint = await prisma.gamePlan.findMany({
    where: {
      mediaSubType: {
        name: 'Print'
      }
    },
    take: 3,
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  console.log('Game Plans with Open TV:');
  gamePlansWithOpenTV.forEach(plan => {
    console.log(`  Campaign: ${plan.campaign?.name} - Media: ${plan.mediaSubType?.name}`);
  });
  console.log('');
  
  console.log('Game Plans with Paid TV:');
  gamePlansWithPaidTV.forEach(plan => {
    console.log(`  Campaign: ${plan.campaign?.name} - Media: ${plan.mediaSubType?.name}`);
  });
  console.log('');
  
  console.log('Game Plans with OOH:');
  gamePlansWithOOH.forEach(plan => {
    console.log(`  Campaign: ${plan.campaign?.name} - Media: ${plan.mediaSubType?.name}`);
  });
  console.log('');
  
  console.log('Game Plans with Print:');
  gamePlansWithPrint.forEach(plan => {
    console.log(`  Campaign: ${plan.campaign?.name} - Media: ${plan.mediaSubType?.name}`);
  });
  console.log('');
  
  // Test validation logic simulation
  console.log('Validation Logic Test:');
  console.log('TV Demographics fields should be:');
  console.log('  ✅ REQUIRED for campaigns with Open TV');
  console.log('  ✅ REQUIRED for campaigns with Paid TV');
  console.log('  ⚠️  WARNING (not required) for campaigns with OOH');
  console.log('  ⚠️  WARNING (not required) for campaigns with Print');
  console.log('  ⚠️  WARNING (not required) for campaigns with Radio');
  console.log('');
  
  // Find a campaign with mixed Traditional media
  const campaignsWithMixedMedia = await prisma.campaign.findMany({
    where: {
      gamePlans: {
        some: {
          mediaSubType: {
            mediaType: {
              name: 'Traditional'
            }
          }
        }
      }
    },
    take: 5,
    include: {
      gamePlans: {
        include: {
          mediaSubType: {
            include: {
              mediaType: true
            }
          }
        }
      }
    }
  });
  
  console.log('Campaigns with Traditional Media:');
  campaignsWithMixedMedia.forEach(campaign => {
    const subtypes = [...new Set(campaign.gamePlans.map(gp => gp.mediaSubType?.name))].filter(Boolean);
    const hasOpenOrPaidTV = subtypes.some(st => st === 'Open TV' || st === 'Paid TV');
    console.log(`  ${campaign.name}:`);
    console.log(`    Media Subtypes: ${subtypes.join(', ')}`);
    console.log(`    TV Demographics Required: ${hasOpenOrPaidTV ? 'YES ✅' : 'NO ⚠️'}`);
    console.log('');
  });
  
  await prisma.$disconnect();
}

testTvDemoValidation().catch(console.error);