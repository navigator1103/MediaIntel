FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code including the SQLite database
COPY . .

# Ensure the SQLite database is copied to the root directory for production
RUN cp /app/prisma/golden_rules.db /app/golden_rules.db || cp /app/golden_rules.db /app/golden_rules.db || echo "Database file copied or already exists"

# Generate Prisma client
RUN npx prisma generate

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
