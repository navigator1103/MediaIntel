import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCurrentValidation() {
  console.log('🧪 Testing Current Reach Planning Validation Logic\n');
  
  // Get some game plans to understand the data structure
  const gamePlans = await prisma.gamePlan.findMany({
    take: 5,
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  console.log('Sample Game Plans:');
  gamePlans.forEach(plan => {
    console.log(`  Campaign: ${plan.campaign?.name}`);
    console.log(`    - Media Type: ${plan.mediaSubType?.mediaType?.name}`);
    console.log(`    - Media SubType: ${plan.mediaSubType?.name}`);
    console.log('');
  });
  
  // Check specific media subtypes
  const tvSubtypes = await prisma.mediaSubType.findMany({
    where: {
      mediaType: {
        name: {
          in: ['TV', 'Traditional']
        }
      }
    },
    include: {
      mediaType: true
    }
  });
  
  console.log('\nTV/Traditional Media Subtypes:');
  tvSubtypes.forEach(st => {
    console.log(`  - ${st.name} (Media Type: ${st.mediaType?.name || 'Unknown'})`);
  });
  
  await prisma.$disconnect();
}

testCurrentValidation().catch(console.error);