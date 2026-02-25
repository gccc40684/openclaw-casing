# Repository Guidelines

- Repo: https://github.com/openclaw/openclaw
- GitHub issues/comments/PR comments: use literal multiline strings or `-F - <<'EOF'` (or $'...') for real newlines; never embed "\\n".
- GitHub comment footgun: never use `gh issue/pr comment -b "..."` when body contains backticks or shell chars. Always use single-quoted heredoc (`-F - <<'EOF'`) so no command substitution/escaping corruption.
- GitHub linking footgun: don't wrap issue/PR refs like `#24643` in backticks when you want auto-linking. Use plain `#24643` (optionally add full URL).
- Security advisory analysis: before triage/severity decisions, read `SECURITY.md` to align with OpenClaw's trust model and design boundaries.

## Project Overview

OpenClaw is a personal AI assistant that runs on your own devices. It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and Zalo Personal. It can speak and listen on macOS/iOS/Android, and can render a live Canvas you control.

The project consists of:

- **Gateway**: WebSocket control plane that owns all messaging surfaces
- **CLI**: Command-line interface for controlling the gateway
- **Pi Agent Runtime**: RPC-mode agent runtime with tool streaming
- **Companion Apps**: macOS menu bar app, iOS app, and Android app
- **Extensions**: Plugin system for additional channels and capabilities

## Technology Stack

- **Language**: TypeScript (ESM) with strict typing
- **Runtime**: Node.js ≥22.12.0
- **Package Manager**: pnpm 10.23.0
- **Build Tool**: tsdown (TypeScript to JavaScript bundler)
- **Linting**: Oxlint (type-aware)
- **Formatting**: Oxfmt
- **Testing**: Vitest with V8 coverage
- **Native Apps**:
  - macOS/iOS: Swift with SwiftUI (Observation framework)
  - Android: Kotlin with Gradle

## Project Structure

### Source Code (`src/`)

| Directory                                                                                              | Purpose                                  |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `src/cli/`                                                                                             | CLI wiring and command-line interface    |
| `src/commands/`                                                                                        | CLI command implementations              |
| `src/gateway/`                                                                                         | WebSocket gateway server (control plane) |
| `src/agents/`                                                                                          | Agent runtime, Pi embedded runner, tools |
| `src/channels/`                                                                                        | Channel abstractions and routing         |
| `src/telegram/`, `src/discord/`, `src/slack/`, `src/signal/`, `src/imessage/`, `src/web/`, `src/line/` | Channel-specific implementations         |
| `src/browser/`                                                                                         | Browser automation (Playwright/CDP)      |
| `src/memory/`                                                                                          | Memory and vector storage                |
| `src/config/`                                                                                          | Configuration management                 |
| `src/security/`                                                                                        | Security utilities and audit             |
| `src/plugin-sdk/`                                                                                      | Plugin Software Development Kit          |
| `src/infra/`                                                                                           | Infrastructure utilities                 |
| `src/auto-reply/`                                                                                      | Auto-reply and message handling          |

### Extensions (`extensions/`)

Extensions are workspace packages providing additional channels and capabilities:

- Channel extensions: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `tlon`, `twitch`, `whatsapp`, `zalo`, `zalouser`
- Feature extensions: `voice-call`, `memory-core`, `memory-lancedb`, `lobster`, `llm-task`, `diagnostics-otel`, `device-pair`

### Applications (`apps/`)

| Directory       | Platform           | Technology     |
| --------------- | ------------------ | -------------- |
| `apps/macos/`   | macOS menu bar app | Swift, SwiftUI |
| `apps/ios/`     | iOS app            | Swift, SwiftUI |
| `apps/android/` | Android app        | Kotlin, Gradle |
| `apps/shared/`  | Shared native code | Swift          |

### Documentation (`docs/`)

Documentation is hosted on Mintlify (docs.openclaw.ai). Key sections:

- `docs/channels/` - Channel setup guides
- `docs/gateway/` - Gateway configuration and protocol
- `docs/cli/` - CLI reference
- `docs/concepts/` - Core concepts
- `docs/platforms/` - Platform-specific guides
- `docs/tools/` - Tool documentation

## Build, Test, and Development Commands

### Installation

```bash
# Install dependencies
pnpm install

# Setup git hooks
pnpm prepare
```

### Development

```bash
# Run CLI in dev mode (TypeScript via tsx)
pnpm openclaw ...
pnpm dev

# Gateway dev mode (auto-reload)
pnpm gateway:watch

# TUI dev mode
pnpm tui:dev
```

### Build

```bash
# Full build (TypeScript + plugin SDK + UI)
pnpm build

# Individual build steps
pnpm canvas:a2ui:bundle  # Bundle A2UI
tsdown                    # TypeScript compilation
pnpm build:plugin-sdk:dts # Plugin SDK type definitions
```

### Testing

```bash
# Run all tests (parallel execution)
pnpm test

# Fast unit tests
pnpm test:fast

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Live tests (requires API keys)
CLAWDBOT_LIVE_TEST=1 pnpm test:live

# Docker-based tests
pnpm test:docker:all

# Watch mode
pnpm test:watch
```

### Linting and Formatting

```bash
# Check all (format, types, lint)
pnpm check

# Format check only
pnpm format:check

# Format fix
pnpm format:fix

# Lint with type awareness
pnpm lint

# Lint fix
pnpm lint:fix

# Swift lint/format (macOS/iOS)
pnpm lint:swift
pnpm format:swift
```

## Code Style Guidelines

### TypeScript

- **Language**: TypeScript (ESM) with strict typing
- **Avoid**: `any` type (enforced by oxlint)
- **Decorators**: Use legacy decorators (`experimentalDecorators: true`, `useDefineForClassFields: false`)
- **Class patterns**: Never share class behavior via prototype mutation. Use explicit inheritance/composition.
- **File size**: Aim to keep files under ~500 LOC; split/refactor when feasible
- **Comments**: Add brief comments for tricky logic

### Import Conventions

```typescript
// Path mapping for plugin SDK
import { ... } from "openclaw/plugin-sdk";
import { ... } from "openclaw/plugin-sdk/account-id";
```

### Code Patterns

- **No prototype mutation**: Do not use `applyPrototypeMixins`, `Object.defineProperty` on `.prototype`
- **Testing**: Prefer per-instance stubs over prototype mutation
- **CLI progress**: Use `src/cli/progress.ts` (`osc-progress` + `@clack/prompts`)
- **Status output**: Use shared CLI palette in `src/terminal/palette.ts` (no hardcoded colors)

### Formatting (Oxfmt)

Configuration in `.oxfmtrc.jsonc`:

- Tab width: 2 spaces
- Experimental import sorting enabled
- Experimental package.json sorting enabled

### Linting (Oxlint)

Configuration in `.oxlintrc.json`:

- Plugins: unicorn, typescript, oxc
- Categories: correctness, perf, suspicious (all error)
- Explicit `any` is forbidden (`typescript/no-explicit-any: error`)

## Testing Guidelines

### Framework

- **Framework**: Vitest with V8 coverage
- **Config**: `vitest.config.ts` (base), `vitest.unit.config.ts`, `vitest.e2e.config.ts`, `vitest.live.config.ts`
- **Pool**: `forks` (vmForks enabled by default, except on Windows/Node 24)
- **Workers**: Auto-detected (max 16 locally, 2-3 in CI)

### Test File Naming

- Unit tests: `*.test.ts`
- E2E tests: `*.e2e.test.ts`
- Live tests: `*.live.test.ts`
- Colocated with source files

### Coverage Thresholds

```javascript
{
  lines: 70,
  functions: 70,
  branches: 55,
  statements: 70
}
```

### Test Environment Variables

| Variable                     | Purpose                         |
| ---------------------------- | ------------------------------- |
| `OPENCLAW_TEST_WORKERS`      | Control test parallelism        |
| `OPENCLAW_TEST_VM_FORKS=0`   | Disable vmForks                 |
| `OPENCLAW_TEST_NO_ISOLATE=1` | Disable test isolation          |
| `OPENCLAW_TEST_PROFILE=low`  | Low resource profile            |
| `OPENCLAW_LIVE_TEST=1`       | Enable live tests               |
| `CLAWDBOT_LIVE_TEST=1`       | Enable OpenClaw-only live tests |

### Python Tests

Python skill scripts are tested with pytest:

```bash
# Run Python tests
python -m pytest -q skills

# Lint Python
python -m ruff check skills
```

## Security Considerations

### Trust Model

OpenClaw uses a **personal assistant trust model**:

- One trusted operator boundary per gateway (single-user/personal assistant)
- **Not** a hostile multi-tenant security boundary for multiple adversarial users
- Gateway and node are one operator trust domain
- Authenticated callers are treated as trusted operators

### Key Security Principles

1. **DM Pairing**: Unknown senders receive a pairing code by default (`dmPolicy="pairing"`)
2. **Allowlists**: Control who can message the bot via `allowFrom` configurations
3. **Sandboxing**: Optional Docker sandboxing for tool execution (`agents.defaults.sandbox.mode`)
4. **Exec Approval**: Configurable approval workflows for bash tool execution

### Security Commands

```bash
# Security audit
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
```

### Reporting Security Issues

See `SECURITY.md` for:

- Reporting procedures
- Trust model details
- Out of scope items
- Common false-positive patterns

## Release Channels

- **stable**: Tagged releases (`vYYYY.M.D`), npm dist-tag `latest`
- **beta**: Prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta`
- **dev**: Moving head on `main`

Switch channels: `openclaw update --channel stable|beta|dev`

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` - Main CI (lint, test, build, macOS, Android)
- `docker-release.yml` - Docker image releases
- `install-smoke.yml` - Installer smoke tests
- `sandbox-common-smoke.yml` - Sandbox smoke tests

### CI Optimizations

- Docs-only changes skip heavy jobs
- Scope detection for targeted testing
- macOS job consolidation (sequential rather than parallel)
- Windows Defender exclusions for Windows tests

## Git and Commit Guidelines

### Commits

Create commits with `scripts/committer "<msg>" <file...>`; avoid manual `git add`/`git commit` so staging stays scoped.

Follow concise, action-oriented commit messages:

- Good: `CLI: add verbose flag to send`
- Good: `gateway: fix race condition in channel reconnect`

### Shorthand Commands

- `sync`: if working tree is dirty, commit all changes, then `git pull --rebase`; if conflicts, stop; otherwise `git push`

## Plugin Development

### Plugin SDK

Plugins use the Plugin SDK exported from `openclaw/plugin-sdk`:

```typescript
import { ... } from "openclaw/plugin-sdk";
```

### Plugin Installation

Plugins are installed with `npm install --omit=dev` in the plugin directory.

### Publishing Plugins

- Keep plugin-only deps in the extension's `package.json`
- Do not use `workspace:*` in `dependencies` (npm install breaks)
- Put `openclaw` in `devDependencies` or `peerDependencies`

## Documentation Guidelines

### Mintlify Docs

- Internal doc links: root-relative, no `.md`/`.mdx` (example: `[Config](/configuration)`)
- Section cross-references: use anchors on root-relative paths (example: `[Hooks](/configuration#hooks)`)
- Avoid em dashes and apostrophes in headings (breaks Mintlify anchor links)
- README (GitHub): keep absolute docs URLs (`https://docs.openclaw.ai/...`)

### i18n

- `docs/zh-CN/**` is generated; do not edit directly
- Pipeline: update English docs → adjust glossary (`docs/.i18n/glossary.zh-CN.json`) → run `scripts/docs-i18n`

## Multi-Agent Safety

- Do **not** create/apply/drop `git stash` entries unless explicitly requested
- Do **not** create/remove/modify `git worktree` checkouts unless explicitly requested
- Do **not** switch branches unless explicitly requested
- Focus reports on your edits; avoid guard-rail disclaimers unless truly blocked
- When multiple agents touch the same file, continue if safe

## Troubleshooting

- Rebrand/migration issues: run `openclaw doctor`
- See `docs/gateway/doctor.md` for doctor command details
- macOS logs: use `./scripts/clawlog.sh` to query unified logs

## External Resources

- **Website**: https://openclaw.ai
- **Docs**: https://docs.openclaw.ai
- **Discord**: https://discord.gg/clawd
- **GitHub**: https://github.com/openclaw/openclaw
- **Vision**: `VISION.md`
- **Contributing**: `CONTRIBUTING.md`
- **Security**: `SECURITY.md`
