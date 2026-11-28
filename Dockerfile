# Rodillo Virtual as a static site: built with Node, served by nginx without root.
# docker build -t rodillo-virtual . && docker run -p 8080:8080 rodillo-virtual
# Only the example athlete goes into the image (config/*.local.json is excluded).

FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Served at the root of the container, not under /rodillo-virtual/ as on GitHub Pages.
ARG BASE_PATH=/
ENV BASE_PATH=${BASE_PATH}
RUN npm run build

# nginx-unprivileged runs as the nginx user (uid 101), listens on 8080 and keeps
# its pid and temporary files in /tmp, so the container can run read-only.
FROM nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
