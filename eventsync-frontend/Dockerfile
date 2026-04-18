# Step 1: Build React app
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# Step 2: Serve using nginx
FROM nginx:alpine

# 🔥 Add nginx config (IMPORTANT FIX)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 🔥 Copy Vite build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]