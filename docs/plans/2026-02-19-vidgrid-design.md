# VidGrid Design Document

**Date:** February 19, 2026
**Status:** Approved

## Overview

VidGrid is a lightweight, single-page web application for displaying up to four video streams simultaneously in a 2x2 grid layout. Built with AstroJS, Tailwind CSS 4, and Bun.

## Technology Choices

- **Framework:** Astro 5.x (Pure Astro + client scripts, no additional UI framework)
- **Styling:** Tailwind CSS 4.x
- **Runtime:** Bun 1.3+
- **Video Streaming:** HLS.js for m3u8 stream support
- **Storage:** Browser LocalStorage

## Project Structure

```
app/src/
├── components/
│   ├── Header.astro       # Persistent header with nav links
│   ├── VideoGrid.astro    # 2x2 grid container
│   ├── VideoPlayer.astro  # Single video player with HLS.js support
│   └── Toast.astro        # Success/error notification component
├── layouts/
│   └── main.astro         # Base layout
├── pages/
│   ├── index.astro        # Play page (default landing)
│   └── settings.astro     # Settings page
└── styles/
    └── global.css         # Tailwind import
```

## Component Design

### Header.astro
- Contains app title/logo and navigation links (Play, Settings)
- Uses Tailwind for styling
- Links use standard `<a>` tags for full page navigation

### VideoPlayer.astro
- Props: `position` (string), `url` (string, optional)
- Client script logic:
  - On load, checks if URL is HLS (ends in `.m3u8`) → initializes HLS.js
  - Otherwise uses native `<video>` element
  - Default muted state
  - Shows controls on hover
- Error handling: Shows "No Stream Configured" overlay if no URL or on load failure

### VideoGrid.astro
- Renders 4 VideoPlayer components in a 2x2 CSS grid
- Loads settings from localStorage on client-side
- Passes URLs to each VideoPlayer via data attributes

### Toast.astro
- Props: `message` (string), `type` (success/error)
- Client script: Auto-fades after 2.5 seconds
- Controlled via data attributes

## Data Flow

### LocalStorage Schema
```typescript
interface StreamSettings {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}
```
Storage key: `vidgrid-settings`

### Settings Page Flow
1. On load: Read from localStorage, populate form fields
2. On Save click:
   - Validate URLs (non-empty check only)
   - Write to localStorage
   - Show toast: "Settings Saved"

### Play Page Flow
1. On load: Read from localStorage
2. Pass settings to VideoGrid
3. VideoGrid renders 4 VideoPlayers with URLs
4. Each VideoPlayer initializes playback (HLS.js or native)

### Error States
- No URL configured → "No Stream Configured" placeholder
- HLS load error → "Stream Unavailable" overlay with retry
- Native video error → "Video Unavailable" overlay

## Implementation Phases

### Phase 1: Core Structure
1. Add HLS.js dependency
2. Create Header.astro component with navigation
3. Update main.astro layout to include Header
4. Create placeholder Play page and Settings page

### Phase 2: Settings Page
1. Create settings form with 4 URL inputs
2. Implement localStorage read/write functions
3. Add Save button with toast notification
4. Form pre-populates from localStorage on load

### Phase 3: Play Page & Video Player
1. Create VideoPlayer.astro with native video support
2. Add HLS.js integration for .m3u8 URLs
3. Create VideoGrid.astro with 2x2 layout
4. Connect localStorage settings to grid
5. Implement placeholder state for empty URLs

### Phase 4: Error Handling & Polish
1. Add error overlays for failed streams
2. Implement hover controls visibility
3. Ensure muted default state
4. Cross-browser testing (Chrome, Firefox, Safari, Edge)

## Non-Goals (V1)

- Mobile responsiveness
- User authentication
- Customizable grid layouts
- Volume normalization
