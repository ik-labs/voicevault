# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### VoiceVault (`artifacts/voicevault`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Purpose**: AI-powered voice banking app for people with disabilities to preserve their voice using ElevenLabs voice cloning

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
- **Routes**:
  - `POST /api/clone-voice` — Accepts multipart audio files, calls ElevenLabs Instant Voice Cloning API
  - `POST /api/speak` — Converts text to speech using a cloned voice_id
  - `POST /api/expand-phrase` — Expands short phrases into natural sentences
  - `GET /api/healthz` — Health check

## Environment Secrets Required
- `ELEVENLABS_API_KEY` — ElevenLabs API key (needs Text to Speech: Access, Voices: Write permissions)
- `SESSION_SECRET` — Session secret

## VoiceVault App Flow
1. **Landing** (`/`) — Headline, "Start Voice Banking" CTA, "How it works" section
2. **Recording** (`/record`) — 7 guided prompts with MediaRecorder API, sends audio to `/api/clone-voice`
3. **Playground** (`/playground`) — Type anything to hear it in your cloned voice, quick phrases grid, phrase expander, download audio
