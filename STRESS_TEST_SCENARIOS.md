# 100-Row Stress Test Documentation

## Overview
**File**: `test-data-stress-test-100-rows.csv`  
**Records**: 100 rows  
**Purpose**: Performance and scalability testing of the validation system

## Test Data Composition

### 📊 **Categories Distribution**
- **Hand Body**: 25 records (25%)
- **Men**: 25 records (25%) 
- **Deo**: 25 records (25%)
- **Face Care**: 25 records (25%)

### 🎯 **Campaign Archetypes Distribution**
- **Innovation**: 40 records (40%)
- **Base Business (Maintenance)**: 40 records (40%)
- **Range Extension**: 20 records (20%)

### 📺 **Media Types Distribution**
- **Digital (PM & FF)**: 50 records (50%)
- **Traditional (Open TV)**: 25 records (25%)
- **Traditional (Paid TV)**: 25 records (25%)

### 💰 **Budget Ranges**
- **Small campaigns**: 14,000 - 20,000 (33%)
- **Medium campaigns**: 21,000 - 30,000 (34%)
- **Large campaigns**: 31,000 - 44,000 (33%)

## Validation Test Scenarios

### ✅ **Valid Data Scenarios (Expected to Pass)**
1. **Proper Category-Range-Campaign Mappings**: All combinations use valid master data relationships
2. **Correct TRP Usage**: TV media types have TRP values, Digital media has 0 TRPs
3. **Valid Date Ranges**: All Initial Dates are before End Dates
4. **Budget Consistency**: Monthly budgets sum to Total Budget
5. **Required Fields**: All WOA, WOFF, and core fields populated

### 📈 **Performance Test Scenarios**
1. **Large Dataset Processing**: 100 records with complex validation rules
2. **Cross-Reference Validation**: Every record tested against master data mappings
3. **Multiple Validation Types**: Format, relationship, consistency, cross-reference rules
4. **Memory Usage**: Large master data + 100 records + validation results
5. **Session Management**: Large session file storage and retrieval

### 🎲 **Data Variety**
1. **Campaign Names**: 85 unique campaigns from master data
2. **Date Spreads**: Campaigns spanning entire 2026-2027 period
3. **Budget Patterns**: Various monthly distribution patterns
4. **Burst Values**: Mix of burst values (1 and 2)
5. **TRP Values**: Realistic TRP ranges for TV campaigns (700K-920K)

## Expected Results

### ⚡ **Performance Expectations**
- **Upload Time**: < 5 seconds
- **Validation Time**: < 10 seconds  
- **Session Size**: ~200-300KB
- **Memory Usage**: Efficient chunked processing
- **UI Responsiveness**: Smooth grid rendering

### ✅ **Validation Expectations**
- **Critical Errors**: 0 (all data designed to be valid)
- **Warnings**: 0 (no budget mismatches or blank fields)
- **Processing**: Should complete successfully
- **Import Ready**: Should be importable without issues

### 📊 **System Stress Points**
1. **Master Data Lookups**: 100 records × multiple validation rules = ~500+ lookups
2. **Cross-Reference Checks**: Category→Range→Campaign validation for all records
3. **Budget Calculations**: Monthly sum validation for 100 records
4. **Date Parsing**: 200 date fields (Initial + End dates)
5. **Grid Rendering**: 100 rows × 19 columns = 1,900 cells

## Testing Instructions

### 1. **Upload Performance Test**
```bash
# Time the upload process
time curl -X POST http://localhost:3006/api/admin/media-sufficiency/upload \
  -F "file=@test-data-stress-test-100-rows.csv" \
  -F "country=India"
```

### 2. **Validation Performance Test**
- Upload file via web interface
- Measure time from upload to validation results display
- Check browser DevTools for performance metrics

### 3. **Session Management Test**
- Check session file size in `data/sessions/`
- Verify session cleanup after 24 hours
- Test session extension on access

### 4. **Memory Usage Test**
```bash
# Monitor memory during processing
top -p $(pgrep -f "next-server") -b -n1 | grep next
```

### 5. **Grid Performance Test**
- Scroll through entire grid
- Edit individual cells
- Sort/filter operations
- Export functionality

## Success Criteria

### ✅ **Performance Benchmarks**
- [ ] Upload completes in < 5 seconds
- [ ] Validation completes in < 10 seconds  
- [ ] Grid renders smoothly (no lag)
- [ ] No memory leaks or excessive usage
- [ ] Session management works correctly

### ✅ **Validation Accuracy**
- [ ] All 100 records pass validation (0 critical errors)
- [ ] Cross-reference validation works for all combinations
- [ ] Budget calculations accurate for all records
- [ ] Date validation processes correctly
- [ ] TRP validation enforced properly

### ✅ **System Stability**
- [ ] No errors in server logs
- [ ] No browser console errors
- [ ] Consistent performance across multiple runs
- [ ] Import process completes successfully
- [ ] Database operations handle 100 records efficiently

## Monitoring Points

### 🔍 **Key Metrics to Watch**
1. **Server Response Times**: API endpoints under load
2. **Database Query Performance**: Validation lookups
3. **Client-Side Performance**: Grid rendering and interactions
4. **Memory Usage**: Both server and client-side
5. **Session File Sizes**: Storage efficiency

### 📝 **Logging Points**
1. Upload processing time per record
2. Validation rule execution time
3. Master data lookup performance
4. Session read/write operations
5. Grid rendering performance

This stress test will help ensure the system can handle realistic production workloads with good performance and stability! 🚀