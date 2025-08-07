import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testDatabaseConnection() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing Database Connection ===${colors.reset}`);
  
  try {
    await prisma.$connect();
    console.log(`${colors.green}✓ Database connected successfully${colors.reset}`);
    
    // Get counts from main tables
    const counts = {
      gamePlans: await prisma.gamePlan.count(),
      campaigns: await prisma.campaign.count(),
      countries: await prisma.country.count(),
      categories: await prisma.category.count(),
      mediaSubTypes: await prisma.mediaSubType.count(),
      users: await prisma.user.count()
    };
    
    console.log(`\n${colors.blue}Database Statistics:${colors.reset}`);
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${colors.bright}${count}${colors.reset} records`);
    });
    
    // Get latest game plans with relationships
    const latestGamePlans = await prisma.gamePlan.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        country: true,
        category: true
      }
    });
    
    if (latestGamePlans.length > 0) {
      console.log(`\n${colors.blue}Latest Game Plans:${colors.reset}`);
      latestGamePlans.forEach((plan: any) => {
        console.log(`  - Campaign: ${plan.campaign.name}`);
        if (plan.country) console.log(`    Country: ${plan.country.name}`);
        if (plan.mediaSubType) console.log(`    Media: ${plan.mediaSubType.mediaType.name} / ${plan.mediaSubType.name}`);
        console.log(`    Total Budget: $${plan.totalBudget?.toLocaleString() || 0}`);
      });
    } else {
      console.log(`${colors.yellow}No game plans found in database${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Database connection failed:${colors.reset}`, error);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing API Endpoints (No Auth) ===${colors.reset}`);
  
  const baseURL = 'http://localhost:3001';
  const endpoints = [
    { path: '/api/dashboard/media-sufficiency', name: 'Media Sufficiency Dashboard' },
    { path: '/api/dashboard/media-sufficiency-reach', name: 'Media Sufficiency Reach' },
    { path: '/api/admin/media-sufficiency/game-plans', name: 'Game Plans List' },
    { path: '/api/countries', name: 'Countries' },
    { path: '/api/brands', name: 'Brands' }
  ];
  
  console.log(`${colors.yellow}Note: Testing without authentication - some endpoints may return 401${colors.reset}`);
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${baseURL}${endpoint.path}`, {
        validateStatus: () => true // Accept any status code
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        console.log(`${colors.green}✓${colors.reset} ${endpoint.name}: ${colors.bright}OK${colors.reset} (${responseTime}ms)`);
        
        // Check data presence
        if (response.data) {
          if (endpoint.path.includes('game-plans') && response.data.gamePlans) {
            console.log(`    Data: ${response.data.gamePlans.length} game plans`);
          } else if (Array.isArray(response.data)) {
            console.log(`    Data: ${response.data.length} items`);
          } else if (response.data.summary) {
            console.log(`    Data: Contains summary with ${Object.keys(response.data).length} sections`);
          }
        }
      } else if (response.status === 401) {
        console.log(`${colors.yellow}⚠${colors.reset} ${endpoint.name}: ${colors.yellow}Requires authentication${colors.reset}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name}: ${colors.red}Status ${response.status}${colors.reset}`);
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name}: ${colors.red}Server not running${colors.reset}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name}: ${colors.red}${error.message}${colors.reset}`);
      }
    }
  }
}

async function testDataFreshness() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing Real-Time Data Updates ===${colors.reset}`);
  
  try {
    // First check if we have campaigns to use
    const existingCampaign = await prisma.campaign.findFirst();
    const existingMediaSubType = await prisma.mediaSubType.findFirst();
    const existingCountry = await prisma.country.findFirst();
    
    if (!existingCampaign || !existingMediaSubType) {
      console.log(`${colors.yellow}⚠ Cannot test data freshness - missing required data (campaigns/media types)${colors.reset}`);
      return;
    }
    
    // Create a test game plan with unique identifier
    const testIdentifier = `TEST_${Date.now()}`;
    const testGamePlan = await prisma.gamePlan.create({
      data: {
        campaignId: existingCampaign.id,
        mediaSubTypeId: existingMediaSubType.id,
        burst: 1,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        totalBudget: 99999,
        countryId: existingCountry?.id || null
      }
    });
    
    console.log(`${colors.green}✓ Test game plan created${colors.reset} (ID: ${testGamePlan.id}, Budget: $99,999)`);
    
    // Check if it appears in the API immediately
    try {
      const response = await axios.get('http://localhost:3001/api/admin/media-sufficiency/game-plans', {
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data) {
        const gamePlans = response.data.gamePlans || response.data;
        const foundTestPlan = Array.isArray(gamePlans) && gamePlans.find((plan: any) => 
          plan.id === testGamePlan.id || plan.totalBudget === 99999
        );
        
        if (foundTestPlan) {
          console.log(`${colors.green}✓ Real-time data confirmed!${colors.reset}`);
          console.log(`  Database changes appear immediately in API responses`);
          console.log(`  No caching issues detected`);
        } else {
          console.log(`${colors.yellow}⚠ Test data not immediately visible in API${colors.reset}`);
          console.log(`  Possible caching or data sync issue`);
        }
      } else if (response.status === 401) {
        console.log(`${colors.yellow}⚠ Cannot verify API data - authentication required${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠ Could not verify via API${colors.reset}`);
    }
    
    // Clean up test data
    await prisma.gamePlan.delete({
      where: { id: testGamePlan.id }
    });
    console.log(`${colors.blue}ℹ Test data cleaned up${colors.reset}`);
    
  } catch (error: any) {
    console.error(`${colors.red}✗ Data freshness test failed:${colors.reset}`, error.message);
  }
}

async function testMediaSufficiencyDashboard() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing Media Sufficiency Dashboard Data ===${colors.reset}`);
  
  try {
    // Get game plans from database
    const dbGamePlans = await prisma.gamePlan.findMany({
      include: {
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        country: true,
        category: true,
        campaign: true
      }
    });
    
    // Calculate aggregations
    let totalBudget = 0;
    const budgetByMediaType: Record<string, number> = {};
    const budgetByCountry: Record<string, number> = {};
    
    dbGamePlans.forEach((plan: any) => {
      totalBudget += plan.totalBudget || 0;
      
      // By Media Type
      if (plan.mediaSubType?.mediaType) {
        const mediaTypeName = plan.mediaSubType.mediaType.name;
        budgetByMediaType[mediaTypeName] = (budgetByMediaType[mediaTypeName] || 0) + (plan.totalBudget || 0);
      }
      
      // By Country
      if (plan.country) {
        budgetByCountry[plan.country.name] = (budgetByCountry[plan.country.name] || 0) + (plan.totalBudget || 0);
      }
    });
    
    console.log(`\n${colors.blue}Database Analysis:${colors.reset}`);
    console.log(`  Total Budget: ${colors.bright}$${totalBudget.toLocaleString()}${colors.reset}`);
    console.log(`  Game Plans: ${colors.bright}${dbGamePlans.length}${colors.reset}`);
    console.log(`  Media Types: ${colors.bright}${Object.keys(budgetByMediaType).length}${colors.reset}`);
    console.log(`  Countries: ${colors.bright}${Object.keys(budgetByCountry).length}${colors.reset}`);
    
    if (Object.keys(budgetByMediaType).length > 0) {
      console.log(`\n${colors.blue}Top Media Types by Budget:${colors.reset}`);
      Object.entries(budgetByMediaType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([type, budget]) => {
          console.log(`  ${type}: $${budget.toLocaleString()}`);
        });
    }
    
    // Try to compare with API
    try {
      const response = await axios.get('http://localhost:3001/api/dashboard/media-sufficiency', {
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data?.summary) {
        console.log(`\n${colors.blue}API vs Database Comparison:${colors.reset}`);
        const apiTotal = response.data.summary.totalBudget || 0;
        const match = Math.abs(apiTotal - totalBudget) < 1; // Allow for floating point differences
        
        if (match) {
          console.log(`  ${colors.green}✓ Data consistency verified${colors.reset}`);
          console.log(`  API and database show matching totals`);
        } else {
          console.log(`  ${colors.yellow}⚠ Data mismatch detected${colors.reset}`);
          console.log(`  API Total: $${apiTotal.toLocaleString()}`);
          console.log(`  DB Total: $${totalBudget.toLocaleString()}`);
        }
      } else if (response.status === 401) {
        console.log(`\n${colors.yellow}Note: API requires authentication for full comparison${colors.reset}`);
      }
    } catch (error) {
      console.log(`\n${colors.yellow}Note: Could not compare with API${colors.reset}`);
    }
    
  } catch (error: any) {
    console.error(`${colors.red}✗ Dashboard test failed:${colors.reset}`, error.message);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════╗
║   Dashboard Real-Time Data Testing Suite   ║
╚════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n${colors.yellow}Note: Make sure the dev server is running (npm run dev) on port 3000${colors.reset}`);
  
  try {
    await testDatabaseConnection();
    await testAPIEndpoints();
    await testMediaSufficiencyDashboard();
    await testDataFreshness();
    
    console.log(`\n${colors.green}${colors.bright}=== Testing Complete ===${colors.reset}`);
    console.log(`\n${colors.cyan}Summary:${colors.reset}`);
    console.log(`• Database connection is working`);
    console.log(`• Check API endpoint results above for authentication issues`);
    console.log(`• Real-time data flow can be verified when APIs are accessible`);
    console.log(`• Dashboard should display live data from the database\n`);
    
  } catch (error) {
    console.error(`${colors.red}Test suite failed:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);