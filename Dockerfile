# Rodillo Virtual as a static site: built with Node, served by nginx.
# docker build -t rodillo-virtual . && docker run -p 8080:80 rodillo-virtual
# Only the example athlete goes into the image (config/*.local.json is excluded).

FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Served at the root of the container, not under /rodillo-virtual/ as on GitHub Pages.
ARG BASE_PATH=/
ENV BASE_PATH=${BASE_PATH}
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
