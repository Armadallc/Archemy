# Render Dockerfile - Backend Only
FROM node:20.19.0

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies (including devDependencies for tsx)
RUN npm ci --production=false

# Copy only server and shared directories (exclude client, mobile, assets)
COPY server/ ./server/
COPY shared/ ./shared/

# Expose port
EXPOSE 8081

# Debug: Print environment variables (non-sensitive) at startup
# Railway automatically passes env vars to containers, but let's verify
RUN echo "Note: Environment variables are passed by Railway at runtime"

# Start the server from root (tsx can resolve server/index.ts)
# Railway will inject environment variables automatically
CMD ["npx", "tsx", "server/index.ts"]
