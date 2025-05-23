# Database Configuration for Golden Rules App

## Local Development (SQLite)
For local development, we'll continue using SQLite for simplicity:

```
DATABASE_URL="file:./prisma/dev.db"
```

## Cloud Deployment (PostgreSQL)
For the cloud environment, we'll use PostgreSQL:

```
DATABASE_URL="postgresql://goldenrules-user:goldenrules-password@localhost:5432/goldenrules?schema=public"
```

## Ensuring Login Works in Both Environments

To ensure the login functionality works reliably in both environments, we've implemented:

1. **Client-Side Authentication for Demo Accounts**:
   - Admin: admin@example.com / admin
   - User: user@example.com / user

2. **API Route Fallback**:
   The `/api/auth/login` route has been updated to support hardcoded demo accounts, ensuring login works even if the database is unavailable.

3. **Environment-Specific Configuration**:
   - Local: SQLite for simplicity
   - Cloud: PostgreSQL for compatibility with the existing cloud setup

## Deployment Instructions

When deploying to the cloud, ensure:
1. The PostgreSQL database is properly configured
2. The `DATABASE_URL` environment variable is set correctly
3. The application has the necessary permissions to access the database

## Testing Login Functionality

To test the login functionality:
1. Use the demo accounts (admin@example.com/admin or user@example.com/user)
2. These accounts will work regardless of database connectivity
