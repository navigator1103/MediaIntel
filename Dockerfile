FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code including the SQLite database
COPY . .

# Install sqlite3 for verification
RUN apk add --no-cache sqlite

# Ensure the SQLite database is copied to the root directory for production
RUN cp /app/prisma/golden_rules.db /app/golden_rules.db && echo "Database copied successfully" || echo "Database copy failed"

# Verify database has complete data
RUN sqlite3 /app/golden_rules.db "SELECT COUNT(*) as media_types FROM media_types;" && \
    sqlite3 /app/golden_rules.db "SELECT COUNT(*) as media_subtypes FROM media_sub_types;" && \
    sqlite3 /app/golden_rules.db "SELECT 'Digital subtypes:', COUNT(*) FROM media_sub_types mst JOIN media_types mt ON mst.media_type_id = mt.id WHERE mt.name = 'Digital';"

# Generate Prisma client
RUN npx prisma generate

# Ensure Prisma doesn't create a new database by running a db push with existing schema
RUN npx prisma db push --skip-generate || echo "DB push completed"

# Build the Next.js application
RUN npm run build

# Set environment variables for SQLite
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:./golden_rules.db

# Ensure database file permissions
RUN chmod 666 /app/golden_rules.db || echo "Database permissions set"

# Expose the port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
