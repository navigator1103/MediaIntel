import { validateMappingConsistency } from './validate-mapping-consistency';

// Simple health check that can be called from other parts of the app
export async function checkMappingHealth(): Promise<{ isHealthy: boolean; errorCount: number }> {
  try {
    const isValid = await validateMappingConsistency();
    return {
      isHealthy: isValid,
      errorCount: isValid ? 0 : -1 // -1 indicates unknown error count
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      isHealthy: false,
      errorCount: -1
    };
  }
}

// Run health check if called directly
if (require.main === module) {
  checkMappingHealth().then(result => {
    console.log(`Mapping Health: ${result.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    process.exit(result.isHealthy ? 0 : 1);
  });
}
