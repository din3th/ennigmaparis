FROM node:20-alpine AS base
WORKDIR /app

# Copy root & workspace package configs
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm run install:all

# Copy full application codebase
COPY . .

# Build frontend production bundle
RUN npm run build --prefix client

EXPOSE 3001

CMD ["npm", "start", "--prefix", "server"]
