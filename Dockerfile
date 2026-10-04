FROM node:22-slim AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Railway's dashboard variables don't reach a Dockerfile build on their own,
# unlike its Railpack builds. Declaring them here is what makes Railway pass
# them in, and the ENV lines are what let `pnpm build` below see them, since
# Vite only bakes in whatever's in the environment at build time
ARG VITE_API_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

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

EXPOSE 4000

# vite binds 127.0.0.1 by default, which a published port can't reach from
# outside the container. The port itself comes from the dev script
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Only the nitro output and its bundled deps are needed at runtime, so the
# build stage's node_modules stays behind
FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# nitro's own fallback is 3000 so this is set rather than left implicit,
# otherwise EXPOSE and the port the server actually listens on disagree.
# Railway injects its own PORT, which takes precedence over this
ENV PORT=4000

COPY --from=build /app/.output ./.output

EXPOSE 4000

CMD ["node", ".output/server/index.mjs"]
