FROM node:22-slim AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Development only. Deliberately not the last stage so `docker build` with no
# --target still produces the production image Railway deploys. The api repo's
# docker-compose.yml bind mounts the source in rather than copying it. That
# leaves this stage holding nothing but the dependencies the dev server needs
FROM node:22-slim AS dev

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

EXPOSE 3000

# vite binds 127.0.0.1 by default, which a published port can't reach from
# outside the container
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Only the nitro output and its bundled deps are needed at runtime, so the
# build stage's node_modules stays behind
FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
