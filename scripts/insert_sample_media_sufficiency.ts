import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertSampleData() {
  try {
    // Sample data based on your provided examples
    const sampleData = [
      {
        lastUpdate: "FC05 2025",
        subRegion: "INDIA",
        country: "India",
        bu: "Nivea",
        category: "Hand Body",
        range: "Milk",
        campaign: "Body Milk 5 in 1",
        franchiseNs: null,
        campaignSocioDemoTarget: "TV : F 22-40 AB, Digital : F 18-34",
        totalCountryPopulationOnTarget: "55,360,000",
        tvCopyLength: "10,15,20",
        tvTargetSize: "43,915,290",
        woaOpenTv: null,
        woaPaidTv: 29,
        totalTrps: 3634,
        tvR1Plus: "81%",
        tvR3Plus: "61%",
        tvIdealReach: "70%",
        cpp2024: null,
        cpp2025: null,
        digitalTarget: "FEM 18-34",
        digitalTargetSize: "131,600,000",
        woaPmFf: 144,
        woaInfluencersAmplification: 82,
        digitalR1Plus: "80%",
        digitalIdealReach: "85%",
        plannedCombinedReach: "91%",
        combinedIdealReach: "90%",
        digitalReachLevelCheck: "-5%",
        tvReachLevelCheck: "11%",
        combinedReachLevelCheck: "1%"
      },
      {
        lastUpdate: "FC05 2025",
        subRegion: "ASEAN",
        country: "Thailand",
        bu: "Nivea",
        category: "Face Cleansing",
        range: "Micellar",
        campaign: "Micellar Core",
        franchiseNs: null,
        campaignSocioDemoTarget: "F20-44",
        totalCountryPopulationOnTarget: "11,418,000",
        tvCopyLength: "15\"",
        tvTargetSize: "16,588,314",
        woaOpenTv: null,
        woaPaidTv: null,
        totalTrps: 1060,
        tvR1Plus: "75%",
        tvR3Plus: "55%",
        tvIdealReach: "76%",
        cpp2024: 0.28,
        cpp2025: 0,
        digitalTarget: "F20-44",
        digitalTargetSize: "11,400,445",
        woaPmFf: 56,
        woaInfluencersAmplification: 43,
        digitalR1Plus: "88%",
        digitalIdealReach: "82%",
        plannedCombinedReach: "91%",
        combinedIdealReach: "91%",
        digitalReachLevelCheck: "6%",
        tvReachLevelCheck: "-1%",
        combinedReachLevelCheck: "1%"
      }
    ];

    console.log('Inserting sample media sufficiency data...');
    
    for (const data of sampleData) {
      const result = await prisma.mediaSufficiency.create({
        data: data
      });
      console.log(`Created record with ID: ${result.id}`);
    }

    console.log('Sample data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertSampleData();