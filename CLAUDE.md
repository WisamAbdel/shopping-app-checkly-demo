# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

### Running the demo

- `make start` — build and run the full stack (all services + Kafka-dependent group + observability stack) via Docker Compose. UI at <http://localhost:8080>; Jaeger at `/jaeger/ui`, Grafana at `/grafana/`, feature flags at `/feature/`, telemetry docs at `/telemetry/`.
- `make start-minimal` — core services only (drops the Kafka group: fraud-detection, accounting), still with observability.
- `make start-no-o11y` / `make start-minimal-no-o11y` — same as above without the observability stack.
- `make start-agentic` — adds the agent/mcp/chatbot services (chatbot UI at `/chatbot/`).
- `make stop` — tear down every compose layer.
- `make build service=<name>` / `make restart service=<name>` / `make redeploy service=<name>` — build, restart, or rebuild-and-restart a single service (also accepts `SERVICE=`). This is the fast loop for iterating on one service without restarting the whole stack.
- Podman is supported instead of Docker: `DOCKER_COMPOSE_CMD="podman compose" make start`.

### Tests

- `make run-frontend-tests` — runs the frontend service's test suite via the Compose test profile.
- `make run-telemetry-tests` — starts the full stack, runs the `test/telemetry` pytest suite (validates emitted traces/metrics/logs against `telemetry-schema/`) against it, then tears the stack down. `make run-telemetry-tests-minimal` and `make run-telemetry-tests-agentic` target the minimal/agentic stacks respectively.
- Each service also has its own native test command (`go test ./...`, `dotnet test`, `pytest`, `cargo test`, etc.) — check the service's own README/Dockerfile since there's no repo-wide single-service test runner.

### Linting / checks

- `make check` — runs misspell, markdownlint, license-header check, and link check; this is what CI's `checks` workflow runs.
- `make fix` — autofixes misspellings.
- Weaver registry check (validates `telemetry-schema/`, run by CI's `Weaver check` job): `docker run --rm --mount type=bind,source="$(pwd)/telemetry-schema",target=/home/weaver/source,readonly <weaver-image-from-src/telemetry-docs/Dockerfile> registry check -r source`.

### Protobuf

- `pb/demo.proto` is the single source of truth for every gRPC contract shared across services.
- `./ide-gen-proto.sh` (or `make generate-protobuf`) regenerates per-language stubs locally for IDE use.
- `make docker-generate-protobuf` does the same fully inside Docker; CI uses this and then `make check-clean-work-tree` to fail if generated stubs weren't committed.

## Architecture

This is the OpenTelemetry Demo ("Astronomy Shop"), a polyglot microservices e-commerce app built to demonstrate OpenTelemetry instrumentation. Around 20 independently-built services live under `src/`, wired together through layered Compose files combined with `-f` flags (never run one in isolation — see `Makefile`'s `DOCKER_COMPOSE_FILES_*` variables): `compose.yaml` (core), `compose.full.yaml` (adds the Kafka-dependent group), `compose.observability.yaml` (Grafana/Jaeger/Prometheus/OpenSearch), `compose.agent.yaml` (agent/mcp/chatbot), `compose.profiling.yaml`, `compose.tests.yaml`.

### Service map

- **frontend-proxy** (Envoy) is the single entrypoint (`:8080`) and reverse-proxies to the frontend and every UI (Jaeger, Grafana, feature flags, telemetry docs, chatbot, OpAMP).
- **frontend** (Next.js/TypeScript) — customer-facing web UI.
- **checkout** (Go) — orchestrates placing an order: calls cart, product-catalog, shipping, currency, payment, email, then publishes order events to Kafka for fraud-detection/accounting to consume.
- **cart** (.NET) — shopping cart, persisted in Valkey (`valkey-cart`).
- **product-catalog** (Go), **shipping** (Rust), **currency** (C++), **payment** (Node), **email** (Ruby), **quote** (PHP), **ad** (Java/Gradle), **recommendation** (Python) — single-purpose gRPC services, one contract each in `pb/demo.proto`.
- **fraud-detection** (Java) and **accounting** (.NET) — Kafka consumers of checkout's order events; only present in the "full" compose group, not `start-minimal`.
- **flagd** + **flagd-ui** — feature-flag evaluation engine and its editor UI; `src/flagd/demo.flagd.json` holds the flag definitions most services read to toggle synthetic failure/latency/scenario behavior.
- **load-generator** — synthetic traffic generator built as a custom k6 binary (xk6-otel extension source in `src/load-generator/xk6-otel`).
- **agent / mcp / chatbot** (Python) — optional agentic layer, only started via `make start-agentic`: mcp exposes demo operations as MCP tools, agent runs the LLM loop, chatbot is its UI.
- **image-provider** — nginx serving static product images.
- **react-native-app** — separate mobile client with its own build/run instructions in `src/react-native-app/README.md`.
- **otel-collector** and **opamp-server** — collect/route all telemetry; opamp remotely manages the collector's config (UI at `/opamp/`).
- **grafana**, **jaeger**, **prometheus**, **opensearch** — observability backends, only present in the `observability` compose layer.
- **telemetry-docs** — serves the Weaver-generated docs for `telemetry-schema/` at `/telemetry/`.

### Cross-cutting contracts

- **`pb/demo.proto`** is shared by every backend service — a schema change requires regenerating stubs for every affected language (see Commands above).
- **`telemetry-schema/`** is a Weaver registry and the single source of truth for all custom telemetry: `attributes/` grouped by business domain, `metrics/` per emitting service, `services/` declaring what each service emits. CI's `weaver registry check` fails the build on drift, so new instrumentation must be defined there first — see the authoring rules in `AGENTS.md`.
- **`.env`** holds shared Compose variables (ports, image versions, `IMAGE_VERSION`); **`.env.override`** is for local, uncommitted overrides layered on top.

### This fork

`checkly.config.ts` and the `checkly` devDependency are local additions for a Checkly monitoring demo/POC — not part of upstream `open-telemetry/opentelemetry-demo`.
