import fs from 'fs';
import path from 'path';

// Set up safeguards to prevent mapping inconsistencies from breaking again
async function setupMappingSafeguards() {
  console.log('🛡️  Setting up safeguards to prevent mapping inconsistencies...\n');

  // 1. Create a package.json script for validation
  console.log('1️⃣ Adding mapping validation to package.json scripts...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['validate-mappings'] = 'npx ts-node scripts/validate-mapping-consistency.ts';
    packageJson.scripts['fix-mappings'] = 'npx ts-node scripts/fix-all-mapping-inconsistencies.ts';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('  ✅ Added npm run validate-mappings command');
    console.log('  ✅ Added npm run fix-mappings command');
  }

  // 2. Create a pre-commit validation hook concept (documentation)
  console.log('\n2️⃣ Creating validation documentation...');
  
  const validationDocPath = path.join(__dirname, '..', 'MAPPING_VALIDATION.md');
  const validationDoc = `# Mapping Validation Guide

## 🚨 IMPORTANT: Always validate mappings after changes!

This project uses a complex mapping system between categories, ranges, campaigns, and business units. To prevent breaking the validation system, always run validation after making changes to \`masterData.json\`.

## Quick Commands

\`\`\`bash
# Validate current mappings
npm run validate-mappings

# Fix common mapping issues automatically
npm run fix-mappings

# Manual validation
npx ts-node scripts/validate-mapping-consistency.ts
\`\`\`

## When to Run Validation

**ALWAYS run validation after:**
- Adding new categories or ranges
- Updating campaign mappings
- Modifying business unit assignments
- Importing new data
- Making changes to masterData.json

## Common Issues and Fixes

### 1. Category-Range Inconsistencies
**Problem**: Category maps to Range, but Range doesn't map back to Category
**Fix**: Ensure bidirectional consistency in \`categoryToRanges\` and \`rangeToCategories\`

### 2. Business Unit Mismatches  
**Problem**: Category in \`dermaCategories\` but maps to different business unit
**Fix**: Ensure all categories in business unit arrays map to correct business unit

### 3. Orphaned Ranges
**Problem**: Range has campaigns but no category assignment
**Fix**: Either assign range to a category or remove campaign mappings

### 4. Missing Array Entries
**Problem**: Category/Range exists in mappings but not in arrays
**Fix**: Keep \`categories\` and \`ranges\` arrays in sync with mappings

## Validation Rules

The validation script checks:
- ✅ Bidirectional category ↔ range consistency
- ✅ Business unit assignment correctness  
- ✅ Campaign coverage for all ranges
- ✅ No orphaned ranges with campaigns
- ✅ Array consistency with mappings

## Emergency Recovery

If mappings are severely broken:
1. \`npm run fix-mappings\` - Attempts automatic fixes
2. Check backups in \`src/lib/validation/\` with \`.backup\` extension
3. Contact team for manual review

## Best Practices

1. **Test before deploy**: Always validate locally first
2. **Backup before changes**: masterData.json is automatically backed up
3. **Document changes**: Note what mappings you modified
4. **Validate frequently**: Don't wait until deploy to check

## Derma vs Nivea Structure

**Derma**: Simple 1:1 category-to-range mapping
- Categories: Acne, Anti Pigment, Sun, Anti Age, Aquaphor, X-Cat, Dry Skin
- Each category has exactly one range with the same name

**Nivea**: Complex many-to-many mappings
- Categories: Deo, Face Care, Face Cleansing, Hand Body, Lip, Men, Sun (Nivea)
- Categories can have multiple ranges, ranges can belong to multiple categories
`;

  fs.writeFileSync(validationDocPath, validationDoc);
  console.log('  ✅ Created MAPPING_VALIDATION.md documentation');

  // 3. Create a simple monitoring function
  console.log('\n3️⃣ Creating mapping health check function...');
  
  const healthCheckPath = path.join(__dirname, 'mapping-health-check.ts');
  const healthCheckCode = `import { validateMappingConsistency } from './validate-mapping-consistency';

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
    console.log(\`Mapping Health: \${result.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}\`);
    process.exit(result.isHealthy ? 0 : 1);
  });
}
`;

  fs.writeFileSync(healthCheckPath, healthCheckCode);
  console.log('  ✅ Created mapping-health-check.ts');

  // 4. Update CLAUDE.md with validation info
  console.log('\n4️⃣ Adding validation info to CLAUDE.md...');
  
  const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
  
  if (fs.existsSync(claudeMdPath)) {
    let claudeMd = fs.readFileSync(claudeMdPath, 'utf-8');
    
    const validationSection = `

## Mapping Validation

**CRITICAL**: Always validate mappings after changes to masterData.json:

\`\`\`bash
npm run validate-mappings  # Check for issues
npm run fix-mappings      # Auto-fix common issues
\`\`\`

The system uses complex category ↔ range ↔ campaign mappings that must stay consistent. See MAPPING_VALIDATION.md for details.

**Common commands:**
- \`npm run validate-mappings\` - Validate mapping consistency  
- \`npm run fix-mappings\` - Auto-fix mapping issues
- \`npx ts-node scripts/mapping-health-check.ts\` - Quick health check
`;

    // Add the section before the last line (if it's not already there)
    if (!claudeMd.includes('## Mapping Validation')) {
      claudeMd = claudeMd.trim() + validationSection;
      fs.writeFileSync(claudeMdPath, claudeMd);
      console.log('  ✅ Added mapping validation section to CLAUDE.md');
    } else {
      console.log('  ℹ️  Mapping validation section already exists in CLAUDE.md');
    }
  }

  console.log('\n✅ All safeguards have been set up!');
  
  console.log('\n🛡️  Summary of safeguards:');
  console.log('  1. npm run validate-mappings - Easy validation command');
  console.log('  2. npm run fix-mappings - Auto-fix common issues');
  console.log('  3. MAPPING_VALIDATION.md - Comprehensive documentation');
  console.log('  4. mapping-health-check.ts - Programmatic health check');
  console.log('  5. Updated CLAUDE.md - Instructions for future development');
  
  console.log('\n🎯 To prevent future breakage:');
  console.log('  • Run validation after ANY changes to masterData.json');
  console.log('  • Review MAPPING_VALIDATION.md for best practices');
  console.log('  • Use the auto-fix script for common issues');
  console.log('  • Keep backups of working masterData.json');
}

// Run the setup
setupMappingSafeguards().catch(console.error);