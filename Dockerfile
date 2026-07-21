# syntax=docker/dockerfile:1
# Used for local build verification on machines without a native Swift
# toolchain (e.g. this project's Windows dev environment). Production
# deployment installs Swift directly on the Ubuntu server — see
# deploy/README-DEPLOY.md.

FROM swift:5.10-jammy AS build
WORKDIR /app

# Cache dependency resolution separately from source changes.
COPY Package.swift Package.resolved* ./
RUN swift package resolve

COPY Sources ./Sources
COPY Tests ./Tests
RUN swift build -c release --static-swift-stdlib

FROM swift:5.10-jammy-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.build/release/App ./App
COPY Public ./Public
COPY Resources ./Resources

RUN useradd --create-home --shell /usr/sbin/nologin musicmanager \
    && mkdir -p /app/storage \
    && chown -R musicmanager:musicmanager /app
USER musicmanager

EXPOSE 8080
ENTRYPOINT ["./App", "serve", "--env", "production", "--hostname", "0.0.0.0", "--port", "8080"]
