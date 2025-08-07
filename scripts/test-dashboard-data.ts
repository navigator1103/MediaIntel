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
    // Test database connection
    await prisma.$connect();
    console.log(`${colors.green}✓ Database connected successfully${colors.reset}`);
    
    // Get counts from main tables
    const counts = {
      gamePlans: await prisma.gamePlan.count(),
      countries: await prisma.country.count(),
      brands: await prisma.brand.count(),
      categories: await prisma.category.count(),
      mediaTypes: await prisma.mediaType.count(),
      mediaSubTypes: await prisma.mediaSubType.count(),
      campaigns: await prisma.campaign.count(),
      users: await prisma.user.count()
    };
    
    console.log(`\n${colors.blue}Database Statistics:${colors.reset}`);
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${colors.bright}${count}${colors.reset} records`);
    });
    
    // Get latest game plans
    const latestGamePlans = await prisma.gamePlan.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        country: true,
        mediaType: true,
        category: true
      }
    });
    
    if (latestGamePlans.length > 0) {
      console.log(`\n${colors.blue}Latest Game Plans:${colors.reset}`);
      latestGamePlans.forEach((plan: any) => {
        console.log(`  - ${plan.campaign} (${plan.country.name}, ${plan.mediaType.name})`);
        console.log(`    Budget: Q1: $${plan.q1Budget}, Q2: $${plan.q2Budget}, Q3: $${plan.q3Budget}, Q4: $${plan.q4Budget}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Database connection failed:${colors.reset}`, error);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing API Endpoints ===${colors.reset}`);
  
  const baseURL = 'http://localhost:3000';
  const endpoints = [
    { path: '/api/dashboard/media-sufficiency', name: 'Media Sufficiency Dashboard' },
    { path: '/api/dashboard/media-sufficiency-reach', name: 'Media Sufficiency Reach' },
    { path: '/api/admin/media-sufficiency/game-plans', name: 'Game Plans List' },
    { path: '/api/countries', name: 'Countries' },
    { path: '/api/brands', name: 'Brands' },
    { path: '/api/categories', name: 'Categories' },
    { path: '/api/media-types', name: 'Media Types' }
  ];
  
  // Create a simple auth token for testing (you may need to adjust this)
  const authToken = 'test-token';
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${baseURL}${endpoint.path}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'token=' + authToken
        },
        validateStatus: () => true // Accept any status code
      });
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        console.log(`${colors.green}✓${colors.reset} ${endpoint.name}: ${colors.bright}OK${colors.reset} (${responseTime}ms)`);
        
        // Check if data is present
        if (response.data) {
          const dataInfo = Array.isArray(response.data) 
            ? `${response.data.length} items`
            : typeof response.data === 'object' 
              ? `${Object.keys(response.data).length} fields`
              : 'data present';
          console.log(`    Data: ${dataInfo}`);
        }
      } else if (response.status === 401) {
        console.log(`${colors.yellow}⚠${colors.reset} ${endpoint.name}: ${colors.yellow}Unauthorized (need valid auth)${colors.reset}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${endpoint.name}: ${colors.red}Status ${response.status}${colors.reset}`);
      }
    } catch (error: any) {
      console.log(`${colors.red}✗${colors.reset} ${endpoint.name}: ${colors.red}Failed - ${error.message}${colors.reset}`);
    }
  }
}

async function testDataFreshness() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing Data Freshness ===${colors.reset}`);
  
  try {
    // Insert a test game plan
    const testGamePlan = await prisma.gamePlan.create({
      data: {
        campaign: `TEST_CAMPAIGN_${Date.now()}`,
        countryId: 1, // Assuming India has ID 1
        brandId: 1,
        categoryId: 1,
        mediaTypeId: 1,
        mediaSubTypeId: 1,
        pmTypeId: 1,
        q1Budget: 1000,
        q2Budget: 2000,
        q3Budget: 3000,
        q4Budget: 4000,
        lastUpdate: 1
      }
    });
    
    console.log(`${colors.green}✓ Test game plan created:${colors.reset} ${testGamePlan.campaign}`);
    
    // Now check if it appears in the API
    const response = await axios.get('http://localhost:3000/api/admin/media-sufficiency/game-plans', {
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data) {
      const gamePlans = response.data.gamePlans || response.data;
      const foundTestPlan = gamePlans.find((plan: any) => 
        plan.campaign === testGamePlan.campaign
      );
      
      if (foundTestPlan) {
        console.log(`${colors.green}✓ Test data appears in API immediately${colors.reset}`);
        console.log(`  Real-time data confirmed: Database → API → Frontend`);
      } else {
        console.log(`${colors.yellow}⚠ Test data not found in API response${colors.reset}`);
        console.log(`  Possible caching issue detected`);
      }
    }
    
    // Clean up test data
    await prisma.gamePlan.delete({
      where: { id: testGamePlan.id }
    });
    console.log(`${colors.blue}ℹ Test data cleaned up${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}✗ Data freshness test failed:${colors.reset}`, error);
  }
}

async function testMediaSufficiencyDashboard() {
  console.log(`\n${colors.cyan}${colors.bright}=== Testing Media Sufficiency Dashboard Data ===${colors.reset}`);
  
  try {
    // Get aggregated data from database
    const dbGamePlans = await prisma.gamePlan.findMany({
      include: {
        mediaType: true,
        country: true,
        category: true
      }
    });
    
    // Calculate aggregations like the dashboard does
    const budgetByMediaType: Record<string, number> = {};
    const budgetByCountry: Record<string, number> = {};
    const budgetByCategory: Record<string, number> = {};
    
    let totalBudget = 0;
    
    dbGamePlans.forEach((plan: any) => {
      const planTotal = plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget;
      totalBudget += planTotal;
      
      // By Media Type
      if (!budgetByMediaType[plan.mediaType.name]) {
        budgetByMediaType[plan.mediaType.name] = 0;
      }
      budgetByMediaType[plan.mediaType.name] += planTotal;
      
      // By Country
      if (!budgetByCountry[plan.country.name]) {
        budgetByCountry[plan.country.name] = 0;
      }
      budgetByCountry[plan.country.name] += planTotal;
      
      // By Category
      if (!budgetByCategory[plan.category.name]) {
        budgetByCategory[plan.category.name] = 0;
      }
      budgetByCategory[plan.category.name] += planTotal;
    });
    
    console.log(`\n${colors.blue}Database Aggregations:${colors.reset}`);
    console.log(`  Total Budget: ${colors.bright}$${totalBudget.toLocaleString()}${colors.reset}`);
    console.log(`  Campaign Count: ${colors.bright}${dbGamePlans.length}${colors.reset}`);
    console.log(`  Media Types: ${colors.bright}${Object.keys(budgetByMediaType).length}${colors.reset}`);
    console.log(`  Countries: ${colors.bright}${Object.keys(budgetByCountry).length}${colors.reset}`);
    
    // Compare with API response
    const apiResponse = await axios.get('http://localhost:3000/api/dashboard/media-sufficiency', {
      validateStatus: () => true
    });
    
    if (apiResponse.status === 200 && apiResponse.data) {
      console.log(`\n${colors.blue}API Response Comparison:${colors.reset}`);
      const apiData = apiResponse.data;
      
      if (apiData.summary) {
        const match = apiData.summary.totalBudget === totalBudget &&
                     apiData.summary.campaignCount === dbGamePlans.length;
        
        if (match) {
          console.log(`${colors.green}✓ API data matches database exactly${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠ API data differs from database:${colors.reset}`);
          console.log(`  API Total: $${apiData.summary.totalBudget}`);
          console.log(`  DB Total: $${totalBudget}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}✗ Dashboard test failed:${colors.reset}`, error);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════╗
║   Dashboard Real-Time Data Testing Suite   ║
╚════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n${colors.yellow}Note: Make sure the development server is running (npm run dev)${colors.reset}`);
  
  try {
    // Run all tests
    await testDatabaseConnection();
    await testAPIEndpoints();
    await testMediaSufficiencyDashboard();
    await testDataFreshness();
    
    console.log(`\n${colors.green}${colors.bright}=== Testing Complete ===${colors.reset}`);
    console.log(`${colors.blue}Summary: Check the results above for any issues with real-time data display${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}Test suite failed:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);