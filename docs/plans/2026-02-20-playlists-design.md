# Playlist Feature Design

**Date:** 2026-02-20
**Status:** Approved

## Overview

Add support for multiple playlists, each containing 4 streaming URLs. Users can switch between playlists via pill buttons on the Play page, and manage playlists (CRUD) via a redesigned Settings page with sidebar + editor layout.

## Requirements

- Multiple named playlists with custom icons
- Migrate existing single playlist as "Default"
- Remember last selected playlist across sessions
- Pill/toggle button UI for playlist selection
- Sidebar + editor layout for settings
- Preset icon library (~15 icons)

## Data Model

**File:** `storage/playlists.yaml`

```yaml
activePlaylist: "abc123"
playlists:
  - id: "abc123"
    name: "Default"
    icon: "tv"
    streams:
      topLeft: "https://..."
      topRight: "https://..."
      bottomLeft: "https://..."
      bottomRight: "https://..."
  - id: "def456"
    name: "Sports"
    icon: "basketball"
    streams:
      topLeft: "https://..."
      topRight: ""
      bottomLeft: ""
      bottomRight: ""
```

**TypeScript Types:**

```typescript
interface StreamSettings {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

interface Playlist {
  id: string;        // nanoid
  name: string;
  icon: string;      // icon name from preset library
  streams: StreamSettings;
}

interface PlaylistsConfig {
  activePlaylist: string;
  playlists: Playlist[];
}
```

**Migration:** On first load, if `videourls.yaml` exists but `playlists.yaml` doesn't, migrate the data to a "Default" playlist with icon "tv".

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/playlists` | GET | Get all playlists + active ID |
| `/api/playlists` | POST | Create new playlist |
| `/api/playlists/:id` | PUT | Update playlist |
| `/api/playlists/:id` | DELETE | Delete playlist |
| `/api/playlists/active` | PUT | Set active playlist ID |

### Request/Response Examples

**GET /api/playlists**
```json
{
  "activePlaylist": "abc123",
  "playlists": [
    { "id": "abc123", "name": "Default", "icon": "tv", "streams": {...} },
    { "id": "def456", "name": "Sports", "icon": "basketball", "streams": {...} }
  ]
}
```

**POST /api/playlists**
```json
// Request
{ "name": "News", "icon": "newspaper", "streams": {...} }

// Response
{ "id": "xyz789", "name": "News", "icon": "newspaper", "streams": {...} }
```

**PUT /api/playlists/:id**
```json
// Request
{ "name": "News Updated", "icon": "newspaper", "streams": {...} }

// Response
{ "success": true }
```

**DELETE /api/playlists/:id**
```json
// Response
{ "success": true }
```

**PUT /api/playlists/active**
```json
// Request
{ "activePlaylist": "def456" }

// Response
{ "success": true }
```

## Play Page UI

### Header Layout

```
[ VidGrid ]  [ Default 📺 ] [ Sports 🏀 ] [ News 📰 ]        [ Play ] [ Settings ]
```

- Playlist buttons appear between logo and nav
- Active playlist has filled/highlighted styling
- Pill/chip button style
- Horizontal scroll if overflow

### VideoGrid Behavior

- On load: fetch active playlist, load streams
- On playlist click: update active ID, reload streams

## Settings Page UI

### Layout: Sidebar + Editor

```
┌─────────────────────────────────────────────────────────┐
│  Stream Settings                                         │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  [ + New ]   │   Playlist: [Default    ] [ 📺 ▼ ]      │
│              │                                          │
│  📺 Default  │   Top Left Stream URL                    │
│  🏀 Sports   │   [___________________________]          │
│  📰 News     │                                          │
│              │   Top Right Stream URL                   │
│              │   [___________________________]          │
│              │                                          │
│              │   Bottom Left Stream URL                 │
│              │   [___________________________]          │
│              │                                          │
│              │   Bottom Right Stream URL                │
│              │   [___________________________]          │
│              │                                          │
│              │   [ Save ]  [ Delete Playlist ]          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Sidebar

- List all playlists with icon + name
- Click to select and edit
- "New" button at top
- Delete via button or context menu

### Editor Panel

- Playlist name input
- Icon selector (dropdown)
- 4 stream URL inputs
- Save button
- Delete button (with confirmation)

## Icon Library

Preset icons (15 total):
- tv, basketball, newspaper, dollar, music, film, gamepad, globe, heart, lightning, star, coffee, book, plane, code

## Implementation Scope

### Files to Create

- `app/src/lib/playlists.ts` - Playlist storage utilities
- `app/src/pages/api/playlists/index.ts` - GET all, POST new
- `app/src/pages/api/playlists/[id].ts` - PUT update, DELETE
- `app/src/pages/api/playlists/active.ts` - PUT active ID
- `app/src/components/PlaylistButtons.astro` - Pill buttons for header
- `app/src/components/Icon.astro` - Icon component
- `app/src/components/PlaylistSidebar.astro` - Sidebar list
- `app/src/components/PlaylistEditor.astro` - Editor form

### Files to Modify

- `app/src/components/Header.astro` - Add PlaylistButtons
- `app/src/components/VideoGrid.astro` - Load from active playlist
- `app/src/pages/settings.astro` - Redesign with sidebar layout
- `AGENTS.md` - Update documentation

### Files to Remove

- `app/src/lib/settings.ts` - Replaced by playlists.ts
- `app/src/pages/api/settings.ts` - Replaced by playlists API
- `storage/videourls.yaml` - Migrated to playlists.yaml
