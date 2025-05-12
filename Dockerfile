FROM node:22-bookworm-slim AS base

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy the project
COPY . /app

ENV INITIAL_ADMIN_EMAIL=admin@example.com
ENV INITIAL_ADMIN_PASSWORD=password

RUN apt-get update
RUN apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb git

# Build the editor app
WORKDIR /app/websites/recipe-website/editor

RUN git config --global user.email "${INITIAL_ADMIN_EMAIL}"
RUN git config --global user.name "Docker User"
RUN git config --global init.defaultBranch main

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm dlx auth secret
RUN pnpm run build

RUN pnpm run create-user --email="${INITIAL_ADMIN_EMAIL}" --password="${INITIAL_ADMIN_PASSWORD}"

WORKDIR /app

# Run the editor app server
EXPOSE 3000
ENTRYPOINT []
CMD [ "pnpm", "run", "--filter=recipe-editor", "start" ]
