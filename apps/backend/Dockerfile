FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/cdn/package.json apps/cdn/package.json
RUN npm ci --workspace=@flick/backend --include-workspace-root --cache /tmp/npm-cache
COPY tsconfig.base.json nx.json .npmrc ./
COPY apps/frontend/project.json apps/frontend/project.json
COPY apps/backend/project.json apps/backend/project.json
COPY apps/cdn/project.json apps/cdn/project.json
COPY apps/backend apps/backend
RUN npx nx run backend:build --outputStyle=static

FROM node:24-alpine AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/cdn/package.json apps/cdn/package.json
RUN npm ci --omit=dev --workspace=@flick/backend --cache /tmp/npm-cache && npm cache clean --force --cache /tmp/npm-cache

FROM node:24-alpine
ENV NODE_ENV=production
ENV PORT=4100
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/backend/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/backend/dist ./dist
USER node
EXPOSE 4100
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:4100/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
