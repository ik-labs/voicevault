# VoiceVault

  An AI-powered voice banking tool that helps people preserve their voice using ElevenLabs voice cloning.

  ## What it does

  VoiceVault guides users through a short 7-prompt recording session, clones their voice instantly with ElevenLabs, and lets them type anything to hear it spoken back in their own voice.

  **Built for people with ALS, Parkinson's, stroke, cancer, and other speech-limiting conditions.**

  ## Features

  - 🎙️ **Guided Recording Flow** — 7 natural conversation prompts (not clinical sentences)
  - ⚡ **Instant Voice Cloning** — ElevenLabs Instant Voice Clone API
  - 💬 **Voice Playground** — Type anything, hear it in your voice
  - 📱 **Quick Phrases** — One-tap daily, medical, and social phrases
  - 💌 **Voice Messages** — Generate, preview, download and share audio messages
  - 🔊 **Real-time VU Meter** — Web Audio API audio level visualization
  - ♿ **Fully Accessible** — WCAG AA, large tap targets, aria labels throughout

  ## Tech Stack

  - **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
  - **Backend**: Node.js + Express
  - **Voice AI**: ElevenLabs Voice Cloning + TTS API
  - **Monorepo**: pnpm workspaces + TypeScript

  ## Setup

  1. Clone the repo
  2. Install dependencies: `pnpm install`
  3. Set your ElevenLabs API key: `ELEVENLABS_API_KEY=your_key`
  4. Run the API server: `pnpm --filter @workspace/api-server run dev`
  5. Run the frontend: `pnpm --filter @workspace/voicevault run dev`

  ## API Routes

  | Route | Method | Description |
  |-------|--------|-------------|
  | `/api/clone-voice` | POST | Upload audio files, creates ElevenLabs voice clone |
  | `/api/speak` | POST | Convert text to speech using cloned voice |
  | `/api/expand-phrase` | POST | Expand short phrases into natural sentences |

  ## Built For

  [ElevenHacks](https://elevenlabs.io) — using the [ElevenLabs Impact Program](https://elevenlabs.io/impact)

  Powered by [Replit](https://replit.com)
  