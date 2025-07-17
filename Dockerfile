# --- Stage 1: Build the Application ---
# Use an official Node.js Alpine image for a small footprint
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and all dependencies (including devDependencies for building)
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the source code and configuration files
COPY tsconfig.json .
COPY src ./src

# Run the build script to compile TypeScript to JavaScript
# This will create a '/app/dist' directory
RUN pnpm build


# --- Stage 2: Create the Final Production Image ---
# Start from a fresh, slim Node.js Alpine image
FROM node:20-alpine

WORKDIR /app

# Copy package management files again
COPY package.json pnpm-lock.yaml ./

# Install pnpm and ONLY production dependencies
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy the compiled JavaScript output from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Expose the port your application runs on (from your .env file)
EXPOSE 5000

# The command to start your application in production
# The path is based on your tsconfig.json's rootDir and outDir
CMD ["node", "dist/server.js"]