# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Database:**
- `npx prisma migrate dev` - Run database migrations
- `npx prisma db push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:export` - Export database backup
- `npm run db:import` - Import database backup

**Testing:**
- Use `ts-node` to run TypeScript scripts in the scripts/ directory
- Database operations should be tested with `npm run db:seed` first

## Architecture Overview

This is a **Media Sufficiency Platform** built with Next.js 15, TypeScript, SQLite, and Prisma. The application focuses exclusively on media sufficiency analysis, campaign planning, and budget management for digital marketing campaigns.

### Core Features

1. **Media Sufficiency Upload & Validation**
   - CSV upload with intelligent field mapping and validation
   - Advanced data validation engine with chunked processing for large datasets
   - Session-based import workflow with comprehensive error handling
   - Master data cross-referencing for data integrity

2. **Game Plans Management**
   - Campaign planning with budget allocation across quarters
   - Media type and subtype categorization
   - Country and region-based campaign organization
   - Budget tracking and analysis

3. **Analytics Dashboard**
   - Multi-dimensional budget analysis (by media type, country, category, quarter)
   - Interactive charts using Chart.js and Recharts
   - Campaign performance visualization
   - Summary statistics and KPIs

4. **User Management**
   - Role-based access control (admin/user)
   - Brand and country-level access restrictions
   - Simple authentication system

### Database Schema

The Prisma schema (`prisma/schema.prisma`) uses SQLite (`media_sufficiency.db`) with these key entities:
- **Users**: Authentication and authorization
- **Countries/Regions/SubRegions/Clusters**: Hierarchical geographic organization
- **Brands**: Brand management
- **Categories/Ranges**: Product categorization with many-to-many relationships
- **MediaTypes/MediaSubTypes**: Media classification hierarchy
- **PMTypes**: Project manager type classifications
- **GamePlans**: Core campaign planning with budget tracking
- **Campaigns**: Campaign management linked to ranges

### Key Files & Directories

- `src/app/api/admin/media-sufficiency/` - Core media sufficiency processing APIs
- `src/app/admin/media-sufficiency/` - Admin pages for upload and game plan management
- `src/app/dashboard/media-sufficiency/` - Main analytics dashboard
- `src/lib/validation/mediaSufficiencyValidator.ts` - Advanced CSV validation engine
- `src/lib/validation/masterData.json` - Reference data for validation
- `src/components/media-sufficiency/` - UI components for data grids and upload
- `prisma/schema.prisma` - Database schema focused on media sufficiency
- `scripts/` - Utility scripts for data operations and maintenance

### Important Patterns

1. **Session-based Processing**: Large CSV files are processed in chunks with session persistence
2. **Master Data Validation**: All imported data is cross-referenced against master data
3. **Error Categorization**: Validation issues are categorized as critical/warning/suggestion
4. **Intelligent Field Mapping**: CSV columns are auto-mapped to database fields with variations support
5. **Chunked Data Processing**: Memory-efficient processing for datasets with 1000+ records

### Authentication

Demo authentication system with hardcoded credentials:
- Admin: `admin@example.com` / `admin`
- User: `user@example.com` / `user`

### Admin Navigation

The admin panel includes:
- **Dashboard**: Overview and navigation hub
- **Media Sufficiency Upload**: CSV upload and validation interface
- **Game Plans Management**: Campaign planning and budget management
- **User Management**: User administration

### Development Notes

- **Database**: SQLite (`media_sufficiency.db`) for development and production
- **Processing**: Chunked processing for large datasets (>1000 records)
- **Type Safety**: Full TypeScript implementation with strict checking
- **Styling**: Tailwind CSS with custom components
- **Error Handling**: Comprehensive error handling with detailed logging
- **File Storage**: Upload sessions stored in `data/sessions/` directory
- **Charts**: Dual charting libraries (Chart.js and Recharts) for different visualization needs

### Common Workflows

1. **Media Sufficiency Import**: Upload CSV → Field Mapping → Validation → Review Issues → Import to Database
2. **Game Plan Creation**: Upload campaign data → Validate budgets and media types → Generate game plans
3. **Analytics Review**: View dashboard → Filter by dimensions → Analyze budget distributions → Export insights