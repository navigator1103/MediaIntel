FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code (excluding the SQLite database initially)
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Set environment variables for SQLite
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:./prisma/golden_rules.db

# Create a directory for the database if it doesn't exist
RUN mkdir -p /app/prisma

# Expose the port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
