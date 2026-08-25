# Contributing to Voices

Thanks for your interest. Voices is small and focused - contributions that keep it
that way are very welcome.

## Setup

```bash
npm install
cp .env.example .env.local   # add ELEVENLABS_API_KEY
npm run dev                  # http://localhost:3037
```

## Before you open a PR

```bash
npm run typecheck   # tsc --noEmit
npm test            # unit tests
npm run build       # production build
```

All three must pass. A `pre-push` git hook runs typecheck + tests automatically.

## Guidelines

- Keep changes small and focused; match the existing style.
- Text chunking (`lib/elevenlabs.ts`) is the core of synthesis - add a unit test when
  you touch it.
- No new dependencies without a clear reason.
- Use plain hyphens in text, not em/en dashes.

## Project layout

| Path | What lives there |
| --- | --- |
| `lib/` | pure logic: TTS, db, auth, voices, manifest |
| `components/` | React UI (the voice-circle honeycomb library) |
| `app/` | Next.js routes + API |
| `tests/` | Vitest unit tests |
