# syntax=docker/dockerfile:1
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY backend/package.json backend/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter backend...
COPY backend backend
# `prisma generate` only reads the schema (no DB connection needed), but
# prisma.config.ts requires DATABASE_URL to be set to load at all.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "dist/main"]
