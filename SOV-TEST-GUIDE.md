# Share of Voice (SOV) Test Guide

## Test Files Overview
Navigate to: `http://localhost:3002/admin/share-of-voice`

---

## ✅ VALID FILES (Should Import Successfully)

### **01-nivea-tv-valid.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: ✅ All validation passes, ready to import
- **Description**: Perfect Nivea TV data with all required fields

### **02-nivea-digital-valid.csv**
- **Business Unit**: Select "Nivea"  
- **Media Type**: Select "Digital"
- **Expected Result**: ✅ All validation passes, ready to import
- **Description**: Perfect Nivea Digital data with spend/impressions

### **03-derma-tv-valid.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"
- **Expected Result**: ✅ All validation passes, ready to import
- **Description**: Perfect Derma TV data with all required fields

### **04-derma-digital-valid.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "Digital"  
- **Expected Result**: ✅ All validation passes, ready to import
- **Description**: Perfect Derma Digital data with spend/impressions

---

## ❌ CRITICAL ERROR FILES (Cannot Import)

### **05-nivea-missing-brand-critical.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Missing Nivea entries
- **Description**: Has Hand Body, Face Care, Lip categories but missing Nivea brand for each

### **06-derma-missing-brand-critical.csv** 
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Missing Derma entries
- **Description**: Has Acne, Anti Pigment, Sun categories but missing Derma brand for each

### **07-nivea-missing-values-critical.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Missing required values
- **Description**: Empty Investment/TRP fields and missing Company names

### **08-derma-missing-values-critical.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Missing required values  
- **Description**: Empty Investment/TRP fields and missing Company names

### **09-nivea-duplicates-critical.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Duplicate combinations
- **Description**: Same Category+Company combinations appear multiple times

### **10-derma-duplicates-critical.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Duplicate combinations
- **Description**: Same Category+Company combinations appear multiple times

### **11-nivea-invalid-categories-critical.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: ❌ Critical errors - Invalid categories
- **Description**: Contains "Shampoo" and "Toothpaste" which are not valid Nivea categories

### **12-derma-invalid-categories-critical.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"  
- **Expected Result**: ❌ Critical errors - Invalid categories
- **Description**: Contains "Shampoo" and "Hand Body" which are not valid Derma categories

---

## 💡 SUGGESTION FILES (Import Allowed with Recommendations)

### **13-nivea-custom-competitors-suggestions.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: 💡 Suggestions only - Can still import
- **Description**: Uses real competitor names (L'Oreal, P&G, etc.) instead of "Competitor 1-5"

### **14-derma-custom-competitors-suggestions.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"
- **Expected Result**: 💡 Suggestions only - Can still import  
- **Description**: Uses real competitor names (Neutrogena, La Roche-Posay, etc.)

---

## ⚠️ WARNING FILES (Import Allowed but Issues Present)

### **15-nivea-invalid-numbers-warnings.csv**
- **Business Unit**: Select "Nivea"
- **Media Type**: Select "TV"
- **Expected Result**: ⚠️ Warnings - Can still import
- **Description**: Invalid number formats (abc, N/A, extra commas)

### **16-derma-invalid-numbers-warnings.csv**
- **Business Unit**: Select "Derma"
- **Media Type**: Select "TV"
- **Expected Result**: ⚠️ Warnings - Can still import
- **Description**: Invalid number formats (xyz, N/A, extra commas)

---

## 🧪 Testing Features

### **Direct Cell Editing**
- Click any cell in the validation grid to edit values
- Use Enter to save, Escape to cancel
- Test with any file after upload

### **Business Unit Templates**
- Select "Nivea" → Download template → Should show "Nivea" brand
- Select "Derma" → Download template → Should show "Derma" brand

### **Import Process**
- Only files without critical errors should allow import
- Files 1-4 should import successfully
- Files 5-12 should block import until fixed
- Files 13-16 should allow import with warnings/suggestions

---

## 📊 Expected Validation Summary

| File | Critical | Warning | Suggestion | Can Import |
|------|----------|---------|------------|------------|
| 01-04 | 0 | 0 | 0 | ✅ Yes |
| 05-12 | 1+ | 0+ | 0+ | ❌ No |
| 13-14 | 0 | 0 | 3+ | ✅ Yes |
| 15-16 | 0 | 2+ | 0+ | ✅ Yes |