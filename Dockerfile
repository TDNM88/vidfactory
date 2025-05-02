FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy only necessary files, excluding CDK-related files
COPY .env .
COPY app/ ./app/
COPY components/ ./components/
COPY config/ ./config/
COPY hooks/ ./hooks/
COPY pages/ ./pages/
COPY public/ ./public/
COPY services/ ./services/
COPY styles/ ./styles/
COPY tailwind.config.ts ./
COPY tsconfig.json ./
COPY next.config.js ./

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
