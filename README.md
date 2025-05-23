# Golden Rules Dashboard

A simplified, integrated application for tracking and managing digital marketing rules across platforms. This project is built with Next.js, TypeScript, Tailwind CSS, and Prisma with SQLite.

## Project Overview

The Golden Rules Dashboard helps digital marketing teams track compliance with platform-specific rules across different brands and countries. It provides:

- Centralized rule definitions for Meta, Google Ads, TikTok, and DV360
- Performance scoring and trend tracking
- Change request workflow with approval process
- Multi-region and multi-brand support

## Tech Stack

- **Frontend & Backend**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based auth

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/golden-rules-dashboard.git
cd golden-rules-dashboard
```

2. Install dependencies

```bash
npm install
```

3. Set up the database

```bash
npx prisma migrate dev
```

4. Import data from the old project (optional)

```bash
npx ts-node scripts/import-data.ts
```

5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
/src
  /app                 # Next.js App Router
    /api               # API Routes
      /auth           # Authentication endpoints
      /rules          # Rules API
      /scores         # Scores API
      /change-requests # Change requests API
    /login            # Login page
    /rules            # Rules pages
    /scores           # Scores pages
    /change-requests  # Change requests pages
  /components         # React components
  /lib                # Utility functions and shared code
/prisma               # Prisma schema and migrations
  /schema.prisma      # Database schema
/scripts              # Utility scripts
  /import-data.ts     # Data migration script
```

## Database Schema

The database includes the following main tables:

- **rules**: Central source of truth for all digital marketing rules
- **scores**: Performance tracking for rules across brands and countries
- **change_requests**: Workflow for requesting score changes
- **countries**, **regions**, **brands**: Supporting reference tables

## Change Request Workflow

The system uses a consistent terminology for change request statuses:

1. "Submitted for Review" - Pending requests waiting for admin action
2. "Approved" - Requests that have been approved by an admin
3. "Rejected" - Requests that have been rejected by an admin

## License

This project is licensed under the MIT License - see the LICENSE file for details.
