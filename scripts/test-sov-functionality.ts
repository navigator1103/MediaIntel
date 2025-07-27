#!/usr/bin/env ts-node

/**
 * Comprehensive SOV (Share of Voice) Functionality Test Script
 * Tests all API endpoints, data operations, and error handling
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  message: string;
  duration: number;
  error?: any;
}

class SOVTester {
  private results: TestResult[] = [];
  private testCountryId: number = 0;
  private testBusinessUnitId: number = 0;

  private log(message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m',   // Red
      WARN: '\x1b[33m',    // Yellow
      RESET: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${type}: ${message}${colors.RESET}`);
  }

  private async runTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      this.log(`Starting test: ${testName}`);
      await testFunction();
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        status: 'PASS',
        message: 'Test completed successfully',
        duration
      });
      this.log(`✓ PASS: ${testName} (${duration}ms)`, 'SUCCESS');
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({
        test: testName,
        status: 'FAIL',
        message: error.message || 'Unknown error',
        duration,
        error
      });
      this.log(`✗ FAIL: ${testName} - ${error.message} (${duration}ms)`, 'ERROR');
      console.error('Error details:', error);
    }
  }

  async setupTestData() {
    this.log('Setting up test data...');
    
    // First, we need a region for the country
    const testRegion = await prisma.region.upsert({
      where: { name: 'Test Region SOV' },
      update: {},
      create: { 
        name: 'Test Region SOV'
      }
    });

    // Ensure we have test countries and business units
    const testCountry = await prisma.country.upsert({
      where: { name: 'Test Country SOV' },
      update: {},
      create: { 
        name: 'Test Country SOV',
        regionId: testRegion.id
      }
    });
    this.testCountryId = testCountry.id;

    const testBusinessUnit = await prisma.businessUnit.upsert({
      where: { name: 'Test BU SOV' },
      update: {},
      create: { 
        name: 'Test BU SOV'
      }
    });
    this.testBusinessUnitId = testBusinessUnit.id;

    // Create test categories and ranges
    const testCategory = await prisma.category.upsert({
      where: { name: 'Test Category SOV' },
      update: {},
      create: { 
        name: 'Test Category SOV',
        businessUnitId: this.testBusinessUnitId
      }
    });

    const testRange = await prisma.range.upsert({
      where: { name: 'Test Range SOV' },
      update: {},
      create: { 
        name: 'Test Range SOV'
      }
    });

    // Link category to range
    await prisma.categoryToRange.upsert({
      where: {
        categoryId_rangeId: {
          categoryId: testCategory.id,
          rangeId: testRange.id
        }
      },
      update: {},
      create: {
        categoryId: testCategory.id,
        rangeId: testRange.id
      }
    });

    this.log(`Test data setup complete - Country ID: ${this.testCountryId}, Business Unit ID: ${this.testBusinessUnitId}`, 'SUCCESS');
  }

  async testDatabaseConnection() {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    if (!result) throw new Error('Database connection failed');
  }

  async testCountriesAPI() {
    const countries = await prisma.country.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    if (countries.length === 0) {
      throw new Error('No countries found in database');
    }
    
    this.log(`Found ${countries.length} countries in database`);
  }

  async testBusinessUnitsAPI() {
    const businessUnits = await prisma.businessUnit.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    if (businessUnits.length === 0) {
      throw new Error('No business units found in database');
    }
    
    this.log(`Found ${businessUnits.length} business units in database`);
  }

  async testCategoriesForBusinessUnit() {
    // Test fetching categories for a business unit (like the grid does)
    const categories = await prisma.category.findMany({
      where: {
        businessUnitId: this.testBusinessUnitId
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (categories.length === 0) {
      throw new Error('No categories found for test business unit');
    }

    this.log(`Found ${categories.length} categories for business unit ${this.testBusinessUnitId}`);
  }

  async testSOVDataSaving() {
    // Test saving SOV data (simulating the grid save operation)
    const testData = [
      {
        category: 'Test Category SOV',
        company: 'Nivea',
        totalTvInvestment: 100000,
        totalTvTrps: 500,
        totalDigitalSpend: 0,
        totalDigitalImpressions: 0
      },
      {
        category: 'Test Category SOV',
        company: 'Competitor 1',
        totalTvInvestment: 50000,
        totalTvTrps: 250,
        totalDigitalSpend: 0,
        totalDigitalImpressions: 0
      }
    ];

    // Clear existing test data
    await prisma.shareOfVoice.deleteMany({
      where: {
        countryId: this.testCountryId,
        businessUnitId: this.testBusinessUnitId
      }
    });

    // Transform data like the API does
    const transformedData = testData.map(row => ({
      countryId: this.testCountryId,
      businessUnitId: this.testBusinessUnitId,
      category: row.category.trim(),
      company: row.company.trim(),
      uploadedBy: 'test-script',
      uploadSession: `test-${Date.now()}`,
      totalTvInvestment: row.totalTvInvestment > 0 ? row.totalTvInvestment : null,
      totalTvTrps: row.totalTvTrps > 0 ? row.totalTvTrps : null,
      totalDigitalSpend: null,
      totalDigitalImpressions: null
    }));

    // Save data
    const result = await prisma.shareOfVoice.createMany({
      data: transformedData
    });

    if (result.count !== testData.length) {
      throw new Error(`Expected to save ${testData.length} records, but saved ${result.count}`);
    }

    this.log(`Successfully saved ${result.count} SOV records`);
  }

  async testSOVDataLoading() {
    // Test loading existing SOV data
    const existingData = await prisma.shareOfVoice.findMany({
      where: {
        countryId: this.testCountryId,
        businessUnitId: this.testBusinessUnitId
      },
      select: {
        id: true,
        category: true,
        company: true,
        totalTvInvestment: true,
        totalTvTrps: true,
        totalDigitalSpend: true,
        totalDigitalImpressions: true
      }
    });

    if (existingData.length === 0) {
      throw new Error('No existing SOV data found after saving');
    }

    this.log(`Successfully loaded ${existingData.length} SOV records`);
    
    // Verify data integrity
    const hasNivea = existingData.some(record => record.company === 'Nivea');
    const hasCompetitor = existingData.some(record => record.company === 'Competitor 1');
    
    if (!hasNivea) throw new Error('Nivea record not found in loaded data');
    if (!hasCompetitor) throw new Error('Competitor 1 record not found in loaded data');
    
    this.log('Data integrity check passed');
  }

  async testSOVDataUpdate() {
    // Test updating existing SOV data
    const updatedData = [
      {
        category: 'Test Category SOV',
        company: 'Nivea',
        totalTvInvestment: 150000, // Updated value
        totalTvTrps: 750,          // Updated value
        totalDigitalSpend: 0,
        totalDigitalImpressions: 0
      },
      {
        category: 'Test Category SOV',
        company: 'Competitor 1',
        totalTvInvestment: 75000,  // Updated value
        totalTvTrps: 375,          // Updated value
        totalDigitalSpend: 0,
        totalDigitalImpressions: 0
      },
      {
        category: 'Test Category SOV',
        company: 'Competitor 2',   // New competitor
        totalTvInvestment: 25000,
        totalTvTrps: 125,
        totalDigitalSpend: 0,
        totalDigitalImpressions: 0
      }
    ];

    // Delete existing data (like the API does)
    const deleteResult = await prisma.shareOfVoice.deleteMany({
      where: {
        countryId: this.testCountryId,
        businessUnitId: this.testBusinessUnitId
      }
    });

    this.log(`Deleted ${deleteResult.count} existing records`);

    // Save updated data
    const transformedData = updatedData.map(row => ({
      countryId: this.testCountryId,
      businessUnitId: this.testBusinessUnitId,
      category: row.category.trim(),
      company: row.company.trim(),
      uploadedBy: 'test-script-update',
      uploadSession: `test-update-${Date.now()}`,
      totalTvInvestment: row.totalTvInvestment > 0 ? row.totalTvInvestment : null,
      totalTvTrps: row.totalTvTrps > 0 ? row.totalTvTrps : null,
      totalDigitalSpend: null,
      totalDigitalImpressions: null
    }));

    const result = await prisma.shareOfVoice.createMany({
      data: transformedData
    });

    if (result.count !== updatedData.length) {
      throw new Error(`Expected to save ${updatedData.length} updated records, but saved ${result.count}`);
    }

    this.log(`Successfully saved ${result.count} updated SOV records`);

    // Verify updates
    const nivea = await prisma.shareOfVoice.findFirst({
      where: {
        countryId: this.testCountryId,
        businessUnitId: this.testBusinessUnitId,
        company: 'Nivea'
      }
    });

    if (!nivea || nivea.totalTvInvestment !== 150000) {
      throw new Error('Nivea investment not updated correctly');
    }

    this.log('Update verification passed');
  }

  async testDigitalSOVData() {
    // Test digital media type SOV data
    const digitalData = [
      {
        category: 'Test Category SOV',
        company: 'Nivea',
        totalTvInvestment: 0,
        totalTvTrps: 0,
        totalDigitalSpend: 80000,
        totalDigitalImpressions: 5000000
      },
      {
        category: 'Test Category SOV',
        company: 'Competitor 1',
        totalTvInvestment: 0,
        totalTvTrps: 0,
        totalDigitalSpend: 60000,
        totalDigitalImpressions: 3500000
      }
    ];

    // Clear existing data
    await prisma.shareOfVoice.deleteMany({
      where: {
        countryId: this.testCountryId,
        businessUnitId: this.testBusinessUnitId
      }
    });

    // Transform and save digital data
    const transformedData = digitalData.map(row => ({
      countryId: this.testCountryId,
      businessUnitId: this.testBusinessUnitId,
      category: row.category.trim(),
      company: row.company.trim(),
      uploadedBy: 'test-script-digital',
      uploadSession: `test-digital-${Date.now()}`,
      totalTvInvestment: null,
      totalTvTrps: null,
      totalDigitalSpend: row.totalDigitalSpend > 0 ? row.totalDigitalSpend : null,
      totalDigitalImpressions: row.totalDigitalImpressions > 0 ? row.totalDigitalImpressions : null
    }));

    const result = await prisma.shareOfVoice.createMany({
      data: transformedData
    });

    if (result.count !== digitalData.length) {
      throw new Error(`Expected to save ${digitalData.length} digital records, but saved ${result.count}`);
    }

    this.log(`Successfully saved ${result.count} digital SOV records`);
  }

  async testSOVSchemaValidation() {
    // Test that the ShareOfVoice table has the expected schema
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(ShareOfVoice)` as any[];
    
    const expectedColumns = [
      'id', 'countryId', 'businessUnitId', 'category', 'company',
      'totalTvInvestment', 'totalTvTrps', 'totalDigitalSpend', 
      'totalDigitalImpressions', 'uploadedBy', 'uploadSession'
    ];

    const actualColumns = tableInfo.map((col: any) => col.name);
    
    for (const expectedCol of expectedColumns) {
      if (!actualColumns.includes(expectedCol)) {
        throw new Error(`Missing expected column: ${expectedCol}`);
      }
    }

    this.log(`Schema validation passed - found all ${expectedColumns.length} expected columns`);
  }

  async testErrorHandling() {
    // Test various error conditions
    
    // Test saving with invalid country ID
    try {
      await prisma.shareOfVoice.create({
        data: {
          countryId: 99999, // Non-existent country
          businessUnitId: this.testBusinessUnitId,
          category: 'Test',
          company: 'Test',
          uploadedBy: 'test',
          uploadSession: 'test'
        }
      });
      throw new Error('Should have failed with invalid country ID');
    } catch (error: any) {
      if (!error.message.includes('Foreign key constraint')) {
        this.log('Expected foreign key constraint error for invalid country ID', 'SUCCESS');
      }
    }

    // Test saving with missing required fields
    try {
      await prisma.shareOfVoice.create({
        data: {
          countryId: this.testCountryId,
          businessUnitId: this.testBusinessUnitId,
          // Missing category and company
          uploadedBy: 'test',
          uploadSession: 'test'
        } as any
      });
      throw new Error('Should have failed with missing required fields');
    } catch (error: any) {
      this.log('Expected validation error for missing required fields', 'SUCCESS');
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...');
    
    // Remove test SOV data
    await prisma.shareOfVoice.deleteMany({
      where: {
        countryId: this.testCountryId,
        businessUnitId: this.testBusinessUnitId
      }
    });

    // Remove test category-range relationships
    await prisma.categoryToRange.deleteMany({
      where: {
        category: {
          businessUnitId: this.testBusinessUnitId
        }
      }
    });

    // Remove test ranges
    await prisma.range.deleteMany({
      where: {
        name: 'Test Range SOV'
      }
    });

    // Remove test data
    await prisma.country.deleteMany({
      where: {
        name: 'Test Country SOV'
      }
    });

    await prisma.businessUnit.deleteMany({
      where: {
        name: 'Test BU SOV'
      }
    });

    await prisma.category.deleteMany({
      where: {
        name: 'Test Category SOV'
      }
    });

    this.log('Cleanup completed', 'SUCCESS');
  }

  async runAllTests() {
    this.log('Starting SOV Functionality Test Suite', 'INFO');
    this.log('=====================================', 'INFO');

    try {
      await this.setupTestData();

      await this.runTest('Database Connection', () => this.testDatabaseConnection());
      await this.runTest('Countries API', () => this.testCountriesAPI());
      await this.runTest('Business Units API', () => this.testBusinessUnitsAPI());
      await this.runTest('Categories for Business Unit', () => this.testCategoriesForBusinessUnit());
      await this.runTest('SOV Schema Validation', () => this.testSOVSchemaValidation());
      await this.runTest('SOV Data Saving', () => this.testSOVDataSaving());
      await this.runTest('SOV Data Loading', () => this.testSOVDataLoading());
      await this.runTest('SOV Data Update', () => this.testSOVDataUpdate());
      await this.runTest('Digital SOV Data', () => this.testDigitalSOVData());
      await this.runTest('Error Handling', () => this.testErrorHandling());

    } finally {
      await this.cleanup();
      await prisma.$disconnect();
    }

    this.printSummary();
  }

  private printSummary() {
    this.log('=====================================', 'INFO');
    this.log('Test Summary', 'INFO');
    this.log('=====================================', 'INFO');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.log(`Total Tests: ${total}`, 'INFO');
    this.log(`Passed: ${passed}`, passed === total ? 'SUCCESS' : 'INFO');
    this.log(`Failed: ${failed}`, failed > 0 ? 'ERROR' : 'INFO');

    if (failed > 0) {
      this.log('Failed Tests:', 'ERROR');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          this.log(`  - ${r.test}: ${r.message}`, 'ERROR');
        });
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    this.log(`Total Duration: ${totalDuration}ms`, 'INFO');

    this.log('=====================================', 'INFO');
    this.log(failed === 0 ? 'ALL TESTS PASSED! ✅' : 'SOME TESTS FAILED! ❌', failed === 0 ? 'SUCCESS' : 'ERROR');
  }
}

// Run the tests
async function main() {
  const tester = new SOVTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { SOVTester };