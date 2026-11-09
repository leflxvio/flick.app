FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/cdn/package.json apps/cdn/package.json
RUN npm ci --workspace=@flick/frontend --include-workspace-root --cache /tmp/npm-cache
COPY tsconfig.base.json nx.json .npmrc ./
COPY apps/frontend/project.json apps/frontend/project.json
COPY apps/backend/project.json apps/backend/project.json
COPY apps/cdn/project.json apps/cdn/project.json
COPY apps/frontend apps/frontend
RUN npx nx run frontend:build --outputStyle=static

FROM nginx:stable-alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
