# Media Sufficiency Data Import Process Improvements

## Current Limitations

1. **CSV Parsing Issues**:
   - Current parsing is error-prone with inconsistent handling of CSV format variations
   - No support for different date formats (currently expects YYYY-MM-DD)
   - No handling for currency symbols or thousand separators in budget fields

2. **Validation Limitations**:
   - Manual conflict resolution is time-consuming
   - No batch resolution for similar issues
   - No preview of data before import
   - No validation for date ranges and budget allocations

3. **User Experience Issues**:
   - Limited feedback during import process
   - No progress tracking for large imports
   - No import history or ability to revert imports
   - No data export functionality

4. **Technical Limitations**:
   - In-memory session storage is not reliable for large files
   - No transaction support for database operations
   - No error recovery mechanism
   - Temporary file storage is not secure or scalable

## Proposed Improvements

### 1. Enhanced CSV Parsing

- **Robust CSV Parser**: Implement a more robust CSV parser that can handle:
  - Different CSV dialects (delimiters, quote characters)
  - Malformed data and encoding issues
  - Headers with or without spaces
  - Case-insensitive field matching

- **Smart Data Type Conversion**:
  - Auto-detect and convert date formats (support MM/DD/YYYY, DD/MM/YYYY, etc.)
  - Handle currency symbols and thousand separators in budget fields
  - Normalize text fields (trim whitespace, handle case sensitivity)

- **Sample Implementation**:
```typescript
// Enhanced CSV parser with better error handling
import { parse } from 'csv-parse/sync';

function parseCSV(fileContent: string) {
  try {
    // First try with standard options
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    console.error('Standard parsing failed, trying with relaxed options:', error);
    
    // Try with more relaxed options
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true
    });
  }
}
```

### 2. Improved Validation System

- **Smart Field Mapping**:
  - Auto-map similar field names (e.g., "Media Type" and "MediaType")
  - Suggest corrections for misspelled field names
  - Support for custom field mapping

- **Batch Conflict Resolution**:
  - Group similar conflicts for batch resolution
  - Provide "Apply to all" option for common issues
  - Machine learning-based suggestions for resolving conflicts

- **Data Preview and Validation**:
  - Interactive data preview with highlighting of potential issues
  - Real-time validation as user edits data
  - Validation rules for date ranges, budget allocations, and other business logic

- **Sample Implementation**:
```typescript
// Smart field mapping function
function mapFields(headers: string[], standardFields: string[]) {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    // Try exact match first
    const exactMatch = standardFields.find(f => f.toLowerCase() === header.toLowerCase());
    if (exactMatch) {
      mapping[header] = exactMatch;
      return;
    }
    
    // Try fuzzy match
    const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
    const fuzzyMatch = standardFields.find(f => {
      const normalizedField = f.toLowerCase().replace(/[_\s-]/g, '');
      return normalizedField === normalizedHeader;
    });
    
    if (fuzzyMatch) {
      mapping[header] = fuzzyMatch;
    }
  });
  
  return mapping;
}
```

### 3. Enhanced User Experience

- **Progress Tracking**:
  - Real-time progress indicators for large imports
  - Detailed step-by-step import wizard
  - Clear success/error messages with actionable information

- **Import History and Management**:
  - Log of all import sessions with status and metadata
  - Ability to view, download, or revert previous imports
  - Comparison between imports to identify changes

- **Data Export**:
  - Export current data to CSV/Excel for offline editing
  - Template generation based on current database schema
  - Scheduled exports for reporting

- **Sample Implementation**:
```typescript
// Import history tracking
interface ImportSession {
  id: string;
  fileName: string;
  timestamp: Date;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  recordCount: number;
  successCount: number;
  errorCount: number;
  userId: string;
  errors?: Array<{
    type: string;
    message: string;
    rowIndex?: number;
    field?: string;
  }>;
}

// In database schema
model ImportHistory {
  id          String   @id @default(uuid())
  fileName    String
  timestamp   DateTime @default(now())
  status      String
  recordCount Int
  successCount Int
  errorCount  Int
  userId      String?
  errors      Json?    // Stored as JSON array
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4. Technical Improvements

- **Database-Backed Session Storage**:
  - Store import sessions in the database instead of memory or temporary files
  - Support for resumable imports and better error recovery
  - Improved security and scalability

- **Transaction Support**:
  - Wrap database operations in transactions for atomicity
  - Ability to rollback failed imports
  - Validation before committing changes

- **Performance Optimizations**:
  - Stream processing for large files
  - Batch database operations
  - Background processing for time-consuming operations

- **Sample Implementation**:
```typescript
// Database transaction for import
async function importData(sessionId: string) {
  // Start a transaction
  return await prisma.$transaction(async (tx) => {
    // Get session data
    const session = await tx.importSession.findUnique({
      where: { id: sessionId },
      include: { records: true }
    });
    
    if (!session) throw new Error('Session not found');
    
    // Update session status
    await tx.importSession.update({
      where: { id: sessionId },
      data: { status: 'importing' }
    });
    
    // Process records in batches
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < session.records.length; i += batchSize) {
      const batch = session.records.slice(i, i + batchSize);
      
      try {
        // Process batch
        await processBatch(tx, batch);
        successCount += batch.length;
      } catch (error) {
        errorCount += batch.length;
        errors.push({
          type: 'batch_error',
          message: error.message,
          rowIndex: i
        });
      }
    }
    
    // Update session with results
    return await tx.importSession.update({
      where: { id: sessionId },
      data: {
        status: errors.length > 0 ? 'completed_with_errors' : 'completed',
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  });
}
```

## Implementation Plan

### Phase 1: CSV Parsing and Validation Improvements
- Implement robust CSV parser with better error handling
- Add smart field mapping and data type conversion
- Enhance validation with batch conflict resolution

### Phase 2: User Experience Enhancements
- Develop interactive data preview and validation
- Add import history and management
- Implement progress tracking and better feedback

### Phase 3: Technical Improvements
- Migrate to database-backed session storage
- Add transaction support and error recovery
- Implement performance optimizations for large files

### Phase 4: Advanced Features
- Add machine learning-based suggestions
- Implement scheduled imports/exports
- Develop comparison tools for data analysis

## Expected Benefits

1. **Reduced Manual Work**: Smart validation and batch resolution will significantly reduce manual data cleaning
2. **Improved Data Quality**: Better validation ensures higher quality data imports
3. **Enhanced User Experience**: Clear feedback and progress tracking improves user confidence
4. **Better Performance**: Technical improvements allow handling larger datasets efficiently
5. **Increased Reliability**: Transaction support and error recovery prevent data corruption
