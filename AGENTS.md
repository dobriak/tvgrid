# VidGrid - Agent Guidelines

## Project Overview

VidGrid is a lightweight, single-page web application for displaying up to four video streams simultaneously in a 2x2 grid layout. Built with AstroJS, Tailwind CSS 4, and Bun.

## Technology Stack

- **Framework:** Astro 5.x
- **Styling:** Tailwind CSS 4.x (via `@tailwindcss/vite` plugin)
- **Runtime:** Bun 1.3+
- **Language:** TypeScript (strict mode)

## Project Structure

```
vidgrid/
├── app/                    # All application code
│   ├── src/
│   │   ├── components/     # Astro components
│   │   ├── layouts/        # Page layouts
│   │   ├── pages/          # Routes (.astro, .md files)
│   │   └── styles/         # Global CSS
│   ├── public/             # Static assets
│   ├── astro.config.mjs    # Astro configuration
│   └── package.json
├── PRD.md                  # Product requirements document
└── AGENTS.md               # This file
```

## Build & Development Commands

All commands should be run from the `app/` directory:

```bash
cd app

# Development
bun run dev          # Start development server (localhost:4321)

# Production
bun run build        # Build for production (outputs to app/dist/)
bun run preview      # Preview production build locally

# Package management
bun add <package>    # Add dependency
bun remove <package> # Remove dependency
```

### Testing

No test framework is currently configured. When adding tests, consider Vitest.

To run a single test file with Vitest:
```bash
bun test path/to/test.spec.ts
```

## Code Style Guidelines

### Formatting

- **Indentation:** Use tabs (not spaces)
- **Quotes:** Double quotes for HTML attributes, single quotes for JS/TS strings
- **Line width:** ~100 chars max

### Imports

Order imports: CSS imports → External dependencies → Internal components

```astro
---
import '../styles/global.css';
import confetti from 'canvas-confetti';
import Button from '../components/Button.astro';
---
```

### TypeScript

- **Strict mode:** Enabled via `astro/tsconfigs/strict`
- **`@ts-check`:** Use in `.mjs` config files
- **Avoid `any`:** Use `unknown` and type guards instead

### Tailwind CSS

- Use utility classes directly in markup
- Use Tailwind 4 syntax: `@import "tailwindcss"`
- Group classes: layout → spacing → sizing → colors → effects

```html
<div class="flex items-center gap-4 p-4 w-full bg-gray-100 rounded-lg shadow-md">
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VideoPlayer.astro` |
| Pages | lowercase/kebab-case | `settings.astro` |
| Layouts | lowercase | `main.astro` |
| Variables | camelCase | `streamUrl` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_STREAMS` |
| Playlist IDs | nanoid | `abc123` |

### Error Handling

- **User-facing errors:** Display friendly messages, not raw error text
- **Video load failures:** Show placeholder with "No Stream Configured"
- **Local Storage:** Wrap in try-catch

### Comments

- **Avoid comments** unless explaining non-obvious business logic
- Self-documenting code is preferred

## Architecture Notes

### Settings Storage

Playlists are stored in `storage/playlists.yaml`:

```yaml
activePlaylist: "abc123"
playlists:
  - id: "abc123"
    name: "Default"
    icon: "tv"
    streams:
      topLeft: "https://example.com/stream1.m3u8"
      topRight: ""
      bottomLeft: "https://example.com/stream2.m3u8"
      bottomRight: ""
```

API endpoints:
- `GET /api/playlists` - Retrieve all playlists and active ID
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/:id` - Update playlist (name, icon, streams)
- `DELETE /api/playlists/:id` - Delete playlist
- `PUT /api/playlists/active` - Set active playlist ID

Icon library: tv, basketball, newspaper, dollar, music, film, gamepad, globe, heart, lightning, star, coffee, book, plane, code

### Video Requirements

- Support HTML5 native formats (MP4, WebM) and HLS streams (via HLS.js)
- Default audio state: **muted**
- Show standard HTML5 video controls on hover

## Desktop-Only

This application is optimized for desktop browsers only. Do not implement mobile-responsive layouts.

## Documentation Lookup

For Astro, Tailwind 4, and Bun documentation, use the `zread` tool to look up current API specifications, as these technologies evolve quickly.

## Pre-commit Checklist

- [ ] Run `bun run build` to verify no build errors
- [ ] Check TypeScript: `bunx tsc --noEmit`
- [ ] Test in multiple desktop browsers if changing video playback
- [ ] Verify playlist persistence works correctly
