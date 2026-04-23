# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim

# Shared libraries @remotion/renderer's Chrome headless shell depends on.
# Debian-slim images ship minimal, so we install them explicitly.
# Source: https://remotion.dev/docs/miscellaneous/linux-dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libasound2 \
    libxrandr2 \
    libxkbcommon0 \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libgbm1 \
    libcups2 \
    libcairo2 \
    libpango-1.0-0 \
    fonts-liberation \
    fonts-noto-color-emoji \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first so Docker can cache this layer across source changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source.
COPY . .

# `next build` → pre-bundle Remotion → download Chrome headless shell.
# All three are baked into the image so runtime never has to do them.
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
