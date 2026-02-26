FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY dist ./dist
COPY prisma ./prisma
COPY audio ./audio

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV ADMIN_PASSWORD=admin123

CMD ["node", "dist/index.js"]
