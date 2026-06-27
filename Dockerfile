# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl unzip
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_NTFY_SERVER_URL
ENV VITE_NTFY_SERVER_URL=$VITE_NTFY_SERVER_URL
RUN --mount=type=cache,id=botc-icons,target=/app/public/icons npm run build

# Serve stage
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
