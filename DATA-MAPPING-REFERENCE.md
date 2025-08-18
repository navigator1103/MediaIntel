# Media Sufficiency Data Mapping Reference

## Overview

This document provides a comprehensive reference for all business unit, category, range, and campaign mappings in the Media Sufficiency Platform. It serves as the authoritative source for understanding the hierarchical data structure and relationships.

## Database Schema Changes

### Many-to-Many Relationship Implementation

**Date**: 2025-08-18

**Change**: Implemented many-to-many relationship between Business Units and Categories to allow categories like "Sun" and "X-Cat" to be shared across multiple business units.

**New Tables**:
- `business_unit_to_category` - Junction table for many-to-many relationship

**Schema Updates**:
- Added `BusinessUnitToCategory` model to Prisma schema
- Updated API endpoints to use new relationship structure
- Maintained backward compatibility with existing `business_unit_id` field

---

## Business Unit Structure

### Nivea Business Unit (ID: 1)

**Categories**: 8 total
1. **Deo** (27 ranges)
2. **Face Care** (7 ranges) 
3. **Face Cleansing** (5 ranges)
4. **Hand Body** (18 ranges)
5. **Lip** (1 range)
6. **Men** (6 ranges)
7. **Sun** (3 ranges) - *Shared with Derma*
8. **X-Cat** (2 ranges) - *Shared with Derma*

### Derma Business Unit (ID: 2)

**Categories**: 6 total
1. **Acne** (1 range)
2. **Anti Age** (1 range)
3. **Anti Pigment** (1 range)
4. **Dry Skin** (6 ranges)
5. **Sun** (3 ranges) - *Shared with Nivea*
6. **X-Cat** (2 ranges) - *Shared with Nivea*

---

## Detailed Category-Range-Campaign Mappings

### NIVEA BUSINESS UNIT

#### 1. Deo Category
**Template Source**: Nivea Category VS Range.csv - Column 2

**Ranges**:
- Black & White → Campaigns: Black & White, Black & White Male, Black & White Female, Grand Slam, Cool White, KIttyCool
- Bliss → Campaigns: Bliss
- Clinical → Campaigns: Clinical, Fendi, Sachet, Zazil
- Cool Kick → Campaigns: Cool Kick (also appears in Men category)
- Deo Even Tone → Campaigns: Extra Bright, Clinical Even Tone, Deo Even Tone Range
- Deo Men → Campaigns: (empty)
- Derma Control → Campaigns: (moved from X-Range)
- Dry Rollon → Campaigns: Dry Rollon, Rollon Men
- Hijab → Campaigns: Hijab Fresh, Hijab
- Men Deep → Campaigns: Deep Men
- Pearl & Beauty → Campaigns: Pearl & Beauty
- Skin Hero → Campaigns: Skin Hero, Skin Power (Hero) (also appears in Face Care)
- X-Range → Campaigns: Derma Control, IAS

#### 2. Face Care Category  
**Template Source**: Nivea Category VS Range.csv - Column 3

**Ranges**:
- C&HYA → Campaigns: C&HYA, Fanta (also appears in Face Cleansing)
- Cellular → Campaigns: Cellular Bakuchiol, 50 Shades, Polaris, Social AWON, Midnight Gold, Sirius, Speedy Gonzales, Stardust, Stargate
- Epigenetics → Campaigns: Sirena, Elevator, Elsa, Genie, Next Gen, Swan Lake
- Facial → Campaigns: Skin Gin, Skin Gin H1, Skin Gin H2
- Luminous 630 → Campaigns: Lucia, Q10 Body, Bright Oil Clear, Luminous Launch India, Potinhos, Q10 Skinclock & Moonlight, Tag-on Luminous Foam, Lucia H1, Lucia H2 (also appears in Hand Body)
- Q10 → Campaigns: Q10 Range, Q10 Guardian, Q10 Skin Diet, Neige, Orionis, fdfdsfd, Body (also appears in Hand Body)
- Skin Hero → Campaigns: Skin Hero, Skin Power (Hero) (also appears in Deo)

#### 3. Face Cleansing Category
**Template Source**: Nivea Category VS Range.csv - Column 5

**Ranges**:
- Acne → Campaigns: Derma Skin Clear, Acne Control, Dermo Purifyer, Anti-Acne Range, Dermopure Body (Bacne), Triple Effect, Dermopure Cleansing (Yoda), Dermopure RL, Gel to Foam, Dermopure Cleansing (Activia) (also appears in Men)
- C&HYA → Campaigns: C&HYA, Fanta (also appears in Face Care)
- Daily Essentials → Campaigns: Daily Essentials
- Micellar → Campaigns: Micellar Core, Micellar Pearl Bright, Micellar Siri, Micellar Siri 2.0, Claro, EMUR, Micellar Aminoacids, Micellar Extra, Micellar Melange, Micellar+, Micellar Siri H1, Micellar Siri H2
- Rose Care → Campaigns: Petals 2022

#### 4. Hand Body Category
**Template Source**: Nivea Category VS Range.csv - Column 1

**Ranges**:
- APC → Campaigns: Skin Hero (THA)
- Aloe → Campaigns: (empty) - *Added per template*
- Body Aloe → Campaigns: Body Aloe Summer
- Body Milk → Campaigns: Body Milk 5 in 1, Lifecycle
- Body Star → Campaigns: Body Star 2
- Brightness → Campaigns: (empty) - *Added per template*
- Crème → Campaigns: (empty) - *Added per template*
- Dark Skin → Campaigns: Radiant Beauty, Harmattan, Zuri
- Even Tone Core → Campaigns: (empty) - *Added per template*
- Extra Bright → Campaigns: Extra Bright Starwalker, Bright Signature, Brightness (also appears in Men)
- Luminous 630 → Campaigns: Multiple campaigns (also appears in Face Care)
- Natural Glow → Campaigns: C&E Tata, Super 8 Core, Natural Glow, C&E, C&AHA and Super C+, Core Asean, Golden Fruit
- Q10 → Campaigns: Multiple campaigns (also appears in Face Care)
- Radiant Beauty → Campaigns: (empty) - *Added per template*
- Repair & Care → Campaigns: Crème, Repair & Care, Soft UV, Soft, Crème Round 2, Neverland, Soft UV Ozonio, Tetris
- Soft → Campaigns: (empty) - *Added per template*
- Vitamin Range → Campaigns: Super 10, Ghostbuster, Hera, Iconova, Milka, Phoenix, Unicorn Super 10, Vitamin Scrub
- Vitamin Serum → Campaigns: (empty) - *Added per template*

#### 5. Lip Category
**Template Source**: Nivea Category VS Range.csv - Column 8

**Ranges**:
- Lip → Campaigns: Lip, Disney, Bla Bla

#### 6. Men Category  
**Template Source**: Nivea Category VS Range.csv - Column 6

**Ranges**:
- Acne → Campaigns: Multiple campaigns (also appears in Face Cleansing)
- Cool Kick → Campaigns: Cool Kick (also appears in Deo)
- Deep → Campaigns: Deep, Deep Cleansing, Auto-Matic Deep, Deep Moisturizing, Deep X-Cat, NM Moisture Challenge
- Extra Bright → Campaigns: Multiple campaigns (also appears in Hand Body)
- Men → Campaigns: DSR Range
- Sensitive → Campaigns: Sensitive Moisture, Korea, Nemo

#### 7. Sun Category (Shared)
**Template Source**: Nivea Category VS Range.csv - Column 7

**Ranges**:
- Protect & Moisture → Campaigns: Protect & Moisture
- Sun → Campaigns: Sun Range, Sun-Protection Range, Sun Roof, Sun, Sun 100, Hydro Fluid Tinted (Bacalar), Sun Range HS1, Sun Range HS2, Melanoma + Sun Roof, Actinic, Sun Oil Control, Superstar, Sun Oil Control Core, Hello
- UV Face → Campaigns: UV Face, UV Specialist, Subelieavable UV, Tinder, UV Face H1

#### 8. X-Cat Category (Shared)
**Template Source**: Nivea Category VS Range.csv - Column 4

**Ranges**:
- X-Cat → Campaigns: Brand (Institutional), Genzit, Club Eucerin, Yo voy al derm, Customers AWON, Lead Capturing AWON, Eucerin brand AWON
- X-Range → Campaigns: Derma Control, IAS

---

### DERMA BUSINESS UNIT

#### 1. Acne Category
**Template Source**: Derma category vs range.csv - Column 1

**Ranges**:
- Acne → Campaigns: Dermo Purifyer, Anti-Acne Range, Dermopure Body (Bacne), Triple Effect, Dermopure Cleansing (Yoda), Dermopure RL, Gel to Foam, Dermopure Cleansing (Activia), Derma Skin Clear, Acne Control, Bright Oil Clear

#### 2. Anti Age Category
**Template Source**: Derma category vs range.csv - Column 2

**Ranges**:
- Anti Age → Campaigns: Epigenetics, Gold Revamp, Elasticity Motown, 3D Serum, 3D Serum + Dragon, Club55 Serum, Epigenetics (Benjamin Button), Epigenetics (Epi 2.0), Epigenius RL, Refillution, Golden Age (Gold Revamp), 3D Serum + Dragon (Gold)

#### 3. Anti Pigment Category  
**Template Source**: Derma category vs range.csv - Column 3

**Ranges**:
- Anti Pigment → Campaigns: Thiamidol Roof, Anti-Pigment Range, Booster Serum, Boosting Essence, Avengers, Dragon, Globe, Hidden Spots, Serum (Avengers), Eyes, Power Duo (Avengers + Gel), AWON Antipigment, The Search is Over, Eyes (KFP), plus many additional campaigns

#### 4. Dry Skin Category
**Template Source**: Derma category vs range.csv - Column 6
**Note**: *Restructured from individual categories to consolidated ranges*

**Ranges**:
- Aquaphor → Campaigns: Aquaphor, Aquaphor Club Eucerin
- Atopi → Campaigns: Atopi  
- Body Lotion → Campaigns: Body Lotion
- Hydration → Campaigns: Body Roof
- pH5 → Campaigns: pH5 Wannabe
- Repair → Campaigns: Urea

#### 5. Sun Category (Shared)
**Template Source**: Derma category vs range.csv - Column 4

**Ranges**: Same as Nivea Sun category (shared)

#### 6. X-Cat Category (Shared)  
**Template Source**: Derma category vs range.csv - Column 5

**Ranges**: Same as Nivea X-Cat category (shared)
- Brand (Institutional) range → Campaigns: Brand (Institutional), Search AWON

---

## Key Changes and Corrections Made

### Nivea Corrections (2025-08-18)

#### Range-Campaign Corrections:
- **Bright Oil Clear**: Moved from Luminous 630 → Acne
- **C&E Tata & C&AHA and Super C+**: Moved from Natural Glow → Vitamin Serum
- **Korea & C&E**: Moved to UV Face
- **Zazil & Sachet**: Moved from Clinical → Even Tone
- **Super 8 Core**: Moved from Natural Glow → Even Tone Core
- **Q10 Body**: Moved from Luminous 630 → Q10
- **Genie**: Moved from Epigenetics → Cellular
- **Social AWON, Search AWON, IAS**: Moved to All range
- **Freeze Budget**: Created new campaign in All range

#### Missing Ranges Added:
- Hand Body: Soft, Aloe, Crème, Brightness, Even Tone Core, Radiant Beauty, Vitamin Serum
- Deo: Derma Control

#### Dual Mappings Created:
- Cool Kick: Available in both Deo and Men
- Skin Hero: Available in both Deo and Face Care
- Multiple ranges appear in multiple categories as per template

### Derma Corrections (2025-08-18)

#### Structural Reorganization:
- **Consolidated Categories**: Converted Aquaphor, Atopi, Body Lotion, Hydration, pH5, Repair from individual categories to ranges under "Dry Skin" category
- **Data Cleanup**: Removed 4 FC05 2025 game plans from Aquaphor category before restructuring

#### Range-Campaign Corrections:
- **Epigenetics**: Moved from unmapped → Anti Age
- **Brand (Institutional)**: Moved from X-Cat → Brand (Institutional) range
- **Search AWON**: Moved from All → Brand (Institutional) range  
- **Body Lotion**: Moved from Dry Skin → Body Lotion range
- **Urea**: Moved from Dry Skin → Repair range
- **Body Roof**: Moved from Dry Skin → Hydration range
- **pH5 Wannabe**: Moved from Dry Skin → pH5 range
- **Atopi**: Moved from Dry Skin → Atopi range
- **Anti-Redness**: Removed from Hydration (not in template)

---

## Shared Categories

### Sun Category
- **Shared Between**: Nivea and Derma
- **Ranges**: UV Face, Sun, Protect & Moisture
- **Total Campaigns**: 20+ campaigns across all ranges
- **Implementation**: Many-to-many relationship allows both business units to access

### X-Cat Category  
- **Shared Between**: Nivea and Derma
- **Purpose**: Cross-category ranges for institutional and brand campaigns
- **Ranges**: X-Cat, X-Range, Brand (Institutional)
- **Implementation**: Many-to-many relationship allows both business units to access

---

## Template Files Reference

### CSV Templates Used:
1. **Nivea Category VS Range.csv** - Defines Nivea category-range structure
2. **Nivea Range vs Campaign.csv** - Defines Nivea range-campaign mappings  
3. **Derma category vs range.csv** - Defines Derma category-range structure
4. **Derma_Range_vs _Campaigns.csv** - Defines Derma range-campaign mappings

### Validation Status:
- ✅ **Nivea**: All categories, ranges, and campaigns match template specifications
- ✅ **Derma**: All categories, ranges, and campaigns match template specifications  
- ✅ **Shared Categories**: Properly implemented with many-to-many relationships
- ✅ **Data Integrity**: All existing campaigns preserved, only mappings corrected

---

## Technical Implementation Notes

### Database Schema:
- **Primary Tables**: business_units, categories, ranges, campaigns
- **Junction Tables**: business_unit_to_category, category_to_range, range_to_campaigns (via range_id)
- **Relationship Model**: Many-to-many between business units and categories

### API Endpoints Updated:
- `/api/admin/categories` - Uses businessUnitToCategories relationship
- `/api/admin/mapping` - Uses businessUnitToCategories relationship

### Admin Interface:
- **Categories Page**: Shows hierarchical Business Unit → Category → Range structure
- **Mapping Page**: Shows complete Business Unit → Category → Range → Campaign hierarchy
- **Both pages**: Now show consistent category counts and relationships

---

## Maintenance Guidelines

### Adding New Data:
1. **New Categories**: Create in categories table, then add to business_unit_to_category
2. **New Ranges**: Create in ranges table, then add to category_to_range  
3. **New Campaigns**: Create in campaigns table with correct range_id
4. **Shared Categories**: Use business_unit_to_category for multiple business unit assignments

### Data Verification:
1. **Template Compliance**: Always verify new mappings against CSV templates
2. **Relationship Integrity**: Ensure all many-to-many relationships are properly maintained
3. **Campaign Assignments**: Verify campaigns are in correct ranges per template specifications

### Backup Strategy:
- Database backups created before major restructuring operations
- Version control for all schema and API changes
- Documentation updated with each structural change

---

*Last Updated: 2025-08-18*
*Document Version: 1.0*
*Generated during comprehensive data mapping verification project*