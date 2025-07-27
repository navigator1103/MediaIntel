import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGamePlans() {
  try {
    const gamePlansCount = await prisma.gamePlan.count()
    console.log(`Total Game Plans: ${gamePlansCount}`)
    
    if (gamePlansCount > 0) {
      const sampleGamePlans = await prisma.gamePlan.findMany({
        take: 5,
        include: {
          country: true,
          category: true,
          campaign: true,
          mediaSubType: {
            include: {
              mediaType: true
            }
          }
        }
      })
      
      console.log('\nSample Game Plans:')
      sampleGamePlans.forEach((gp, index) => {
        console.log(`${index + 1}. ${gp.country?.name} - ${gp.category?.name} - ${gp.campaign?.name} - ${gp.mediaSubType?.mediaType?.name}/${gp.mediaSubType?.name}`)
        console.log(`   Total Budget: ${gp.totalBudget}, Year: ${gp.year}`)
      })
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error checking game plans:', error)
    await prisma.$disconnect()
  }
}

checkGamePlans()