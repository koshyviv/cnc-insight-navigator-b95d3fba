
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy ALL built assets from the build stage (without specifying assetsDir)
COPY --from=build /app/dist /usr/share/nginx/html

# Create assets directory and copy model file
RUN mkdir -p /usr/share/nginx/html/assets
COPY --from=build /app/public/assets/* /usr/share/nginx/html/assets/

# Add custom nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Ensure proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
