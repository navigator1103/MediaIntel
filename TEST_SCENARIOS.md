# Game Plans Validation Test Scenarios

This document outlines comprehensive test cases for the Media Sufficiency Game Plans validation system.

## Test Files Overview

### 1. **test-data-valid-records.csv** ✅
**Purpose**: Test completely valid records that should pass all validation
**Expected Result**: No validation errors, successful import

**Test Records**:
- Hand Body → Body Milk → Body Milk 5 in 1 (Nivea context)
- Men → Deep → Deep (Nivea context) 
- Deo → Black & White → Black & White (Nivea context)

**Validation Checks**:
- ✅ All required fields present
- ✅ Correct category-range-campaign hierarchy
- ✅ Valid budget calculations
- ✅ Proper TV TRP and R1+/R3+ values
- ✅ WOA and WOFF fields populated

---

### 2. **test-data-cross-reference-errors.csv** ❌
**Purpose**: Test cross-reference validation (new validation rules we added)
**Expected Result**: Critical errors for mismatched category-range-campaign combinations

**Test Records & Expected Errors**:
1. **Men → Rockstar → Hijab Fresh**
   - ❌ Range 'Rockstar' not valid for Category 'Men'
   - ❌ Campaign 'Hijab Fresh' not valid for Range 'Rockstar'
   - ❌ Inconsistent data hierarchy

2. **Hand Body → Deep → Body Milk 5 in 1**
   - ❌ Range 'Deep' belongs to 'Men' category, not 'Hand Body'
   - ❌ Campaign mismatch with range

3. **Deo → Body Milk → Black & White**
   - ❌ Range 'Body Milk' belongs to 'Hand Body', not 'Deo'
   - ❌ Cross-business unit mixing

---

### 3. **test-data-missing-required-fields.csv** ❌
**Purpose**: Test required field validation (including new WOA/WOFF requirements)
**Expected Result**: Critical errors for missing required fields

**Test Records & Expected Errors**:
1. **Missing Category**: Empty category field
   - ❌ "Category is required and cannot be empty"

2. **Missing Range**: Empty range field  
   - ❌ "Range is required and cannot be empty"

3. **Missing Campaign + Total Budget**: Empty critical fields
   - ❌ "Campaign is required and cannot be empty"
   - ❌ "Total Budget is required and cannot be empty"

4. **Missing WOA/WOFF**: Tests new required fields
   - ❌ "Total WOA is required and cannot be empty"
   - ❌ "Total WOFF is required and cannot be empty"

---

### 4. **test-data-budget-validation.csv** ⚠️
**Purpose**: Test budget validation and monthly budget warnings
**Expected Result**: Warnings for budget mismatches and blank monthly fields

**Test Records & Expected Issues**:
1. **Budget Mismatch**: Total Budget = 10,000 but monthly sum = 11,000
   - ⚠️ Budget sum warning
   
2. **Budget Mismatch**: Total Budget = 50,000 but monthly sum = 45,000
   - ⚠️ Budget sum warning

3. **Blank Monthly Budgets**: Empty Jan, Feb, Mar fields
   - ⚠️ "Jan budget is blank and will be treated as 0"
   - ⚠️ "Feb budget is blank and will be treated as 0"
   - ⚠️ "Mar budget is blank and will be treated as 0"

---

### 5. **test-data-tv-trp-validation.csv** ❌
**Purpose**: Test conditional TRP and R+ validation for TV media types
**Expected Result**: Critical errors for missing TRP/R+ values on TV campaigns

**Test Records & Expected Errors**:
1. **Open TV without TRPs**: Missing Total TRPs field
   - ❌ "Total TRPs is required for TV campaigns and must be a valid number"

2. **Paid TV without R3+**: Missing Total R3+ (%) field
   - ❌ "Total R3+ (%) is required for TV campaigns and must be a valid percentage"

3. **Digital with TRPs**: TRP values on non-TV media
   - ❌ "Total TRPs should only be used for TV campaigns"

---

### 6. **test-data-derma-nivea-sun.csv** ✅/⚠️
**Purpose**: Test Sun category handling (exists in both Nivea and Derma)
**Expected Result**: System should differentiate based on campaign context

**Test Records**:
1. **Sun → Sun → Sun Range**: Should map to Derma (Sun Range is Derma campaign)
2. **Sun → Protect & Moisture → Protect & Moisture**: Should map to Derma  
3. **Sun → UV Face → UV Face**: Should map to Derma

**Expected Behavior**:
- ✅ All records should be valid (Derma Sun context)
- ✅ System differentiates using campaign mappings
- ⚠️ If mixed with Nivea Sun campaigns, should show warnings

---

### 7. **test-data-new-entities-auto-create.csv** ⚠️
**Purpose**: Test auto-creation of new campaigns and ranges
**Expected Result**: Warnings for auto-created entities, successful processing

**Test Records & Expected Warnings**:
1. **Men → New Range Alpha → New Campaign Alpha**
   - ⚠️ "Range will be auto-created for review"
   - ⚠️ "Campaign will be auto-created for review"

2. **Hand Body → New Range Beta → New Campaign Beta**
   - ⚠️ "Range will be auto-created for review"  
   - ⚠️ "Campaign will be auto-created for review"

3. **Deo → Existing Range → New Campaign Gamma**
   - ⚠️ "Campaign will be auto-created for review"

**Expected Post-Import**:
- ✅ New entities created with `status: 'pending_review'`
- ✅ Automatic category-range linking
- ✅ Import summary shows auto-created entities

---

## Testing Instructions

### Step 1: Upload Each Test File
1. Go to Admin → Media Sufficiency Upload
2. Upload each CSV file individually
3. Review validation results
4. Compare with expected results above

### Step 2: Validation Review
- **Critical Errors**: Must be fixed before import
- **Warnings**: Can proceed with import (data will be auto-corrected)
- **Suggestions**: Informational only

### Step 3: Import Testing
- For files with only warnings: Proceed with import
- For files with critical errors: Fix data first
- Check auto-created entities in database

### Step 4: Session Timeout Testing
- Upload a file and leave page open for 25+ hours
- Try to access session - should get "Session expired" message
- Verify session cleanup works via `/api/admin/media-sufficiency/cleanup`

### 8. **test-data-invalid-date-ranges.csv** ❌
**Purpose**: Test date range validation (End Date before Initial Date)
**Expected Result**: Critical errors for invalid date ranges

**Test Records & Expected Errors**:
1. **Initial Date: 01-Jan-2025, End Date: 31-Dec-2024**
   - ❌ "End Date must be after Initial Date"

2. **Initial Date: 15-Jun-2026, End Date: 30-Jan-2026**
   - ❌ "End Date must be after Initial Date"

3. **Initial Date: 01-Dec-2025, End Date: 15-Mar-2025**
   - ❌ "End Date must be after Initial Date"

---

### 9. **test-data-date-validation-mix.csv** ❌
**Purpose**: Test both date format and date range validation
**Expected Result**: Critical errors for invalid dates and date ranges

**Test Records & Expected Errors**:
1. **Valid dates**: Should pass date validation
2. **End Date before Initial Date**: Critical error for date range
3. **Invalid date format**: "invalid-date" should trigger format error
4. **Invalid date format**: "not-a-date" should trigger format error

---

## Expected Validation Summary

| Test File | Critical Errors | Warnings | Should Import |
|-----------|----------------|----------|---------------|
| valid-records | 0 | 0 | ✅ Yes |
| cross-reference-errors | 6+ | 0 | ❌ No |
| missing-required-fields | 6+ | 0 | ❌ No |
| budget-validation | 0 | 6+ | ✅ Yes |
| tv-trp-validation | 3+ | 0 | ❌ No |
| derma-nivea-sun | 0 | 0 | ✅ Yes |
| new-entities-auto-create | 0 | 5+ | ✅ Yes |
| invalid-date-ranges | 3+ | 0 | ❌ No |
| date-validation-mix | 4+ | 0 | ❌ No |

---

## Success Criteria

✅ **Cross-Reference Validation**: System catches category-range-campaign mismatches
✅ **Required Fields**: WOA and WOFF now required (critical errors)
✅ **Budget Validation**: Monthly budget warnings work correctly  
✅ **TV Validation**: TRP/R+ requirements enforced for TV media
✅ **Sun Category**: Properly differentiates Nivea vs Derma context
✅ **Auto-Creation**: New entities created with warnings, not errors
✅ **Date Validation**: End Date before Initial Date shows critical errors (not warnings)
✅ **Session Management**: 24-hour timeout with proper error messages