# Playlists Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multiple playlist support with CRUD operations, playlist switching via pill buttons, and a redesigned Settings page with sidebar + editor layout.

**Architecture:** Store all playlists in a single YAML file. API endpoints handle CRUD and active playlist selection. Frontend components include pill buttons for header, sidebar + editor for settings, and Icon component for preset icons.

**Tech Stack:** Astro 5, TypeScript, js-yaml, nanoid (already available), Tailwind CSS 4

---

### Task 1: Add nanoid dependency

**Files:**
- Modify: `app/package.json`

**Step 1: Install nanoid**

Run: `cd app && bun add nanoid`

Expected: Package added to dependencies

**Step 2: Verify installation**

Run: `cd app && bun pm ls | grep nanoid`

Expected: `nanoid@<version>`

**Step 3: Commit**

```bash
git add app/package.json app/bun.lock
git commit -m "chore: add nanoid for playlist IDs"
```

---

### Task 2: Create playlist storage utilities

**Files:**
- Create: `app/src/lib/playlists.ts`

**Step 1: Create playlists utility module**

Create file `app/src/lib/playlists.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';
import { nanoid } from 'nanoid';

export interface StreamSettings {
	topLeft: string;
	topRight: string;
	bottomLeft: string;
	bottomRight: string;
}

export interface Playlist {
	id: string;
	name: string;
	icon: string;
	streams: StreamSettings;
}

export interface PlaylistsConfig {
	activePlaylist: string;
	playlists: Playlist[];
}

const DEFAULT_STREAMS: StreamSettings = {
	topLeft: '',
	topRight: '',
	bottomLeft: '',
	bottomRight: '',
};

const DEFAULT_CONFIG: PlaylistsConfig = {
	activePlaylist: '',
	playlists: [],
};

function getStoragePath(): string {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const projectRoot = join(__dirname, '..', '..', '..', 'storage');
	return join(projectRoot, 'playlists.yaml');
}

function getLegacyStoragePath(): string {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const projectRoot = join(__dirname, '..', '..', '..', 'storage');
	return join(projectRoot, 'videourls.yaml');
}

function migrateFromLegacy(): PlaylistsConfig | null {
	const legacyPath = getLegacyStoragePath();
	
	if (!existsSync(legacyPath)) {
		return null;
	}
	
	try {
		const content = readFileSync(legacyPath, 'utf-8');
		const data = yaml.load(content) as Partial<StreamSettings>;
		const streams: StreamSettings = { ...DEFAULT_STREAMS, ...data };
		
		const playlistId = nanoid();
		return {
			activePlaylist: playlistId,
			playlists: [{
				id: playlistId,
				name: 'Default',
				icon: 'tv',
				streams,
			}],
		};
	} catch (e) {
		console.error('Failed to migrate legacy settings:', e);
		return null;
	}
}

export function loadPlaylists(): PlaylistsConfig {
	const filePath = getStoragePath();
	
	if (existsSync(filePath)) {
		try {
			const content = readFileSync(filePath, 'utf-8');
			const data = yaml.load(content) as Partial<PlaylistsConfig>;
			return { ...DEFAULT_CONFIG, ...data };
		} catch (e) {
			console.error('Failed to load playlists:', e);
		}
	}
	
	const migrated = migrateFromLegacy();
	if (migrated) {
		savePlaylists(migrated);
		return migrated;
	}
	
	return { ...DEFAULT_CONFIG };
}

export function savePlaylists(config: PlaylistsConfig): boolean {
	const filePath = getStoragePath();
	const dir = dirname(filePath);
	
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	
	try {
		const content = yaml.dump(config);
		writeFileSync(filePath, content, 'utf-8');
		return true;
	} catch (e) {
		console.error('Failed to save playlists:', e);
		return false;
	}
}

export function createPlaylist(name: string, icon: string, streams?: StreamSettings): Playlist {
	return {
		id: nanoid(),
		name,
		icon,
		streams: streams || { ...DEFAULT_STREAMS },
	};
}

export function getActivePlaylist(config: PlaylistsConfig): Playlist | undefined {
	return config.playlists.find(p => p.id === config.activePlaylist);
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd app && bunx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add app/src/lib/playlists.ts
git commit -m "feat: add playlist storage utilities with migration support"
```

---

### Task 3: Create playlists API endpoints

**Files:**
- Create: `app/src/pages/api/playlists/index.ts`
- Create: `app/src/pages/api/playlists/[id].ts`
- Create: `app/src/pages/api/playlists/active.ts`

**Step 1: Create main playlists endpoint (GET all, POST new)**

Create file `app/src/pages/api/playlists/index.ts`:

```typescript
import type { APIRoute } from 'astro';
import { loadPlaylists, savePlaylists, createPlaylist, type Playlist, type PlaylistsConfig } from '../../../lib/playlists';

export const prerender = false;

export const GET: APIRoute = async () => {
	const config = loadPlaylists();
	return new Response(JSON.stringify(config), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, icon, streams } = body as { name: string; icon: string; streams?: Playlist['streams'] };
		
		if (!name || !icon) {
			return new Response(JSON.stringify({ error: 'Name and icon are required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		const config = loadPlaylists();
		const playlist = createPlaylist(name, icon, streams);
		
		config.playlists.push(playlist);
		
		if (!config.activePlaylist) {
			config.activePlaylist = playlist.id;
		}
		
		if (savePlaylists(config)) {
			return new Response(JSON.stringify(playlist), {
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			});
		} else {
			return new Response(JSON.stringify({ error: 'Failed to save playlist' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Invalid request body' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
```

**Step 2: Create playlist by ID endpoint (PUT, DELETE)**

Create file `app/src/pages/api/playlists/[id].ts`:

```typescript
import type { APIRoute } from 'astro';
import { loadPlaylists, savePlaylists, type Playlist } from '../../../lib/playlists';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
	const { id } = params;
	
	if (!id) {
		return new Response(JSON.stringify({ error: 'Playlist ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	
	try {
		const body = await request.json();
		const { name, icon, streams } = body as Partial<Playlist>;
		
		const config = loadPlaylists();
		const playlistIndex = config.playlists.findIndex(p => p.id === id);
		
		if (playlistIndex === -1) {
			return new Response(JSON.stringify({ error: 'Playlist not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		if (name !== undefined) config.playlists[playlistIndex].name = name;
		if (icon !== undefined) config.playlists[playlistIndex].icon = icon;
		if (streams !== undefined) config.playlists[playlistIndex].streams = streams;
		
		if (savePlaylists(config)) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		} else {
			return new Response(JSON.stringify({ error: 'Failed to save playlist' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Invalid request body' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};

export const DELETE: APIRoute = async ({ params }) => {
	const { id } = params;
	
	if (!id) {
		return new Response(JSON.stringify({ error: 'Playlist ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	
	const config = loadPlaylists();
	const playlistIndex = config.playlists.findIndex(p => p.id === id);
	
	if (playlistIndex === -1) {
		return new Response(JSON.stringify({ error: 'Playlist not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	
	config.playlists.splice(playlistIndex, 1);
	
	if (config.activePlaylist === id) {
		config.activePlaylist = config.playlists[0]?.id || '';
	}
	
	if (savePlaylists(config)) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} else {
		return new Response(JSON.stringify({ error: 'Failed to save playlists' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
```

**Step 3: Create active playlist endpoint**

Create file `app/src/pages/api/playlists/active.ts`:

```typescript
import type { APIRoute } from 'astro';
import { loadPlaylists, savePlaylists } from '../../../lib/playlists';

export const prerender = false;

export const PUT: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const { activePlaylist } = body as { activePlaylist: string };
		
		if (!activePlaylist) {
			return new Response(JSON.stringify({ error: 'activePlaylist is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		const config = loadPlaylists();
		
		const playlistExists = config.playlists.some(p => p.id === activePlaylist);
		if (!playlistExists) {
			return new Response(JSON.stringify({ error: 'Playlist not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		config.activePlaylist = activePlaylist;
		
		if (savePlaylists(config)) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		} else {
			return new Response(JSON.stringify({ error: 'Failed to save' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Invalid request body' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
};
```

**Step 4: Verify build succeeds**

Run: `cd app && bun run build`

Expected: Build completes without errors

**Step 5: Commit**

```bash
git add app/src/pages/api/playlists/
git commit -m "feat: add playlists API endpoints (GET, POST, PUT, DELETE)"
```

---

### Task 4: Create Icon component

**Files:**
- Create: `app/src/components/Icon.astro`

**Step 1: Create Icon component with preset library**

Create file `app/src/components/Icon.astro`:

```astro
---
interface Props {
	name: string;
	class?: string;
}

const { name, class: className = '' } = Astro.props;

const icons: Record<string, string> = {
	tv: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h3v2H8v2h8v-2h-1v-2h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H5V5h14v10z"/></svg>`,
	basketball: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v20M2 12h20M4.93 4.93c4.08 2.37 6.14 6.14 6.14 10.07M19.07 4.93c-4.08 2.37-6.14 6.14-6.14 10.07" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
	newspaper: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
	dollar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>`,
	music: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
	film: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>`,
	gamepad: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
	globe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
	heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
	lightning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`,
	star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
	coffee: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3h-2V5h2zm-4 0v3H8V5h4zm6.5 4H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 9 18.5 9zM4 19h16v2H4v-2z"/></svg>`,
	book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>`,
	plane: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
	code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
};

const iconSvg = icons[name] || icons.tv;
---

<span class:list={['inline-flex items-center justify-center w-5 h-5', className]} set:html={iconSvg} />
```

**Step 2: Commit**

```bash
git add app/src/components/Icon.astro
git commit -m "feat: add Icon component with preset library"
```

---

### Task 5: Create PlaylistButtons component

**Files:**
- Create: `app/src/components/PlaylistButtons.astro`

**Step 1: Create playlist buttons component**

Create file `app/src/components/PlaylistButtons.astro`:

```astro
---
import Icon from './Icon.astro';

interface Props {
	playlists: { id: string; name: string; icon: string }[];
	activePlaylist: string;
}

const { playlists, activePlaylist } = Astro.props;
---

<div class="playlist-buttons flex items-center gap-2 overflow-x-auto" id="playlist-buttons">
	{playlists.map((playlist) => (
		<button
			class:list={[
				'playlist-btn px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
				playlist.id === activePlaylist
					? 'bg-purple-600 text-white'
					: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
			]}
			data-id={playlist.id}
		>
			<Icon name={playlist.icon} class="w-4 h-4" />
			{playlist.name}
		</button>
	))}
</div>

<script>
	async function setActivePlaylist(playlistId: string) {
		try {
			const response = await fetch('/api/playlists/active', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activePlaylist: playlistId }),
			});
			
			if (response.ok) {
				window.dispatchEvent(new CustomEvent('playlist-changed', { detail: { playlistId } }));
			}
		} catch (e) {
			console.error('Failed to set active playlist:', e);
		}
	}
	
	document.querySelectorAll('.playlist-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const id = (btn as HTMLElement).dataset.id;
			if (id) {
				setActivePlaylist(id);
			}
		});
	});
</script>
```

**Step 2: Commit**

```bash
git add app/src/components/PlaylistButtons.astro
git commit -m "feat: add PlaylistButtons component for header"
```

---

### Task 6: Update Header to include PlaylistButtons

**Files:**
- Modify: `app/src/components/Header.astro`

**Step 1: Update Header component**

Replace `app/src/components/Header.astro` with:

```astro
---
import PlaylistButtons from './PlaylistButtons.astro';
import { loadPlaylists, getActivePlaylist } from '../lib/playlists';

const currentPath = Astro.url.pathname;

let playlistsData: { id: string; name: string; icon: string }[] = [];
let activePlaylistId = '';

if (currentPath === '/') {
	const config = loadPlaylists();
	playlistsData = config.playlists.map(p => ({ id: p.id, name: p.name, icon: p.icon }));
	activePlaylistId = config.activePlaylist;
}
---

<header class="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
	<div class="flex items-center gap-6">
		<h1 class="text-xl font-bold">VidGrid</h1>
		{currentPath === '/' && playlistsData.length > 0 && (
			<PlaylistButtons playlists={playlistsData} activePlaylist={activePlaylistId} />
		)}
	</div>
	<nav class="flex gap-6">
		<a
			href="/"
			class:list={[
				'hover:text-purple-400 transition-colors',
				{ 'text-purple-400': currentPath === '/' }
			]}
		>
			Play
		</a>
		<a
			href="/settings"
			class:list={[
				'hover:text-purple-400 transition-colors',
				{ 'text-purple-400': currentPath === '/settings' }
			]}
		>
			Settings
		</a>
	</nav>
</header>
```

**Step 2: Commit**

```bash
git add app/src/components/Header.astro
git commit -m "feat: integrate PlaylistButtons into Header"
```

---

### Task 7: Update VideoGrid to use playlists

**Files:**
- Modify: `app/src/components/VideoGrid.astro`

**Step 1: Update VideoGrid script**

Replace the `<script>` block in `app/src/components/VideoGrid.astro` with:

```astro
<script>
	interface StreamSettings {
		topLeft: string;
		topRight: string;
		bottomLeft: string;
		bottomRight: string;
	}
	
	interface Playlist {
		id: string;
		name: string;
		icon: string;
		streams: StreamSettings;
	}
	
	interface PlaylistsConfig {
		activePlaylist: string;
		playlists: Playlist[];
	}
	
	async function loadPlaylists(): Promise<PlaylistsConfig> {
		try {
			const response = await fetch('/api/playlists');
			if (response.ok) {
				return await response.json();
			}
		} catch (e) {
			console.error('Failed to load playlists:', e);
		}
		return { activePlaylist: '', playlists: [] };
	}
	
	function applyStreams(streams: StreamSettings) {
		document.querySelectorAll('.video-cell').forEach((cell) => {
			const key = (cell as HTMLElement).dataset.key as keyof StreamSettings;
			const url = streams[key];
			const player = cell.querySelector('.video-player');
			
			if (player) {
				(player as HTMLElement).dataset.url = url || '';
				player.dispatchEvent(new CustomEvent('url-update', { detail: { url: url || '' } }));
			}
		});
	}
	
	function getActivePlaylist(config: PlaylistsConfig): Playlist | undefined {
		return config.playlists.find(p => p.id === config.activePlaylist);
	}
	
	loadPlaylists().then((config) => {
		const activePlaylist = getActivePlaylist(config);
		if (activePlaylist) {
			applyStreams(activePlaylist.streams);
		}
	});
	
	window.addEventListener('playlist-changed', async () => {
		const config = await loadPlaylists();
		const activePlaylist = getActivePlaylist(config);
		if (activePlaylist) {
			applyStreams(activePlaylist.streams);
		}
	});
</script>
```

**Step 2: Commit**

```bash
git add app/src/components/VideoGrid.astro
git commit -m "refactor: VideoGrid uses playlist API instead of settings"
```

---

### Task 8: Create PlaylistSidebar component

**Files:**
- Create: `app/src/components/PlaylistSidebar.astro`

**Step 1: Create sidebar component**

Create file `app/src/components/PlaylistSidebar.astro`:

```astro
---
import Icon from './Icon.astro';

interface Props {
	playlists: { id: string; name: string; icon: string }[];
	selectedId: string | null;
}

const { playlists, selectedId } = Astro.props;
---

<div class="sidebar w-64 bg-gray-800 rounded-lg p-4 flex flex-col h-full">
	<button
		id="new-playlist-btn"
		class="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors mb-4"
	>
		+ New Playlist
	</button>
	
	<div class="playlist-list flex-1 overflow-y-auto space-y-1">
		{playlists.map((playlist) => (
			<button
				class:list={[
					'playlist-item w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors',
					playlist.id === selectedId
						? 'bg-purple-600 text-white'
						: 'text-gray-300 hover:bg-gray-700',
				]}
				data-id={playlist.id}
			>
				<Icon name={playlist.icon} class="w-4 h-4" />
				<span class="truncate">{playlist.name}</span>
			</button>
		))}
	</div>
</div>
```

**Step 2: Commit**

```bash
git add app/src/components/PlaylistSidebar.astro
git commit -m "feat: add PlaylistSidebar component"
```

---

### Task 9: Create PlaylistEditor component

**Files:**
- Create: `app/src/components/PlaylistEditor.astro`

**Step 1: Create editor component**

Create file `app/src/components/PlaylistEditor.astro`:

```astro
---
import Icon from './Icon.astro';

interface Props {
	playlist?: {
		id: string;
		name: string;
		icon: string;
		streams: {
			topLeft: string;
			topRight: string;
			bottomLeft: string;
			bottomRight: string;
		};
	} | null;
}

const { playlist } = Astro.props;

const positions = [
	{ key: 'topLeft', label: 'Top Left' },
	{ key: 'topRight', label: 'Top Right' },
	{ key: 'bottomLeft', label: 'Bottom Left' },
	{ key: 'bottomRight', label: 'Bottom Right' },
];

const icons = [
	'tv', 'basketball', 'newspaper', 'dollar', 'music',
	'film', 'gamepad', 'globe', 'heart', 'lightning',
	'star', 'coffee', 'book', 'plane', 'code',
];
---

<div class="editor flex-1 bg-gray-800 rounded-lg p-6" id="playlist-editor">
	{playlist ? (
		<>
			<div class="flex items-center gap-4 mb-6">
				<div class="flex-1">
					<label class="block text-sm font-medium text-gray-300 mb-2">Playlist Name</label>
					<input
						type="text"
						id="playlist-name"
						value={playlist.name}
						class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>
				</div>
				<div class="w-32">
					<label class="block text-sm font-medium text-gray-300 mb-2">Icon</label>
					<select
						id="playlist-icon"
						class="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
					>
						{icons.map((icon) => (
							<option value={icon} selected={icon === playlist.icon}>
								{icon}
							</option>
						))}
					</select>
				</div>
			</div>
			
			<div class="space-y-4 mb-6">
				{positions.map((pos) => (
					<div>
						<label
							for={pos.key}
							class="block text-sm font-medium text-gray-300 mb-2"
						>
							{pos.label} Stream URL
						</label>
						<input
							type="url"
							id={pos.key}
							name={pos.key}
							value={playlist.streams[pos.key as keyof typeof playlist.streams]}
							placeholder="https://example.com/stream.m3u8"
							class="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
						/>
					</div>
				))}
			</div>
			
			<div class="flex gap-4">
				<button
					id="save-btn"
					class="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
					data-id={playlist.id}
				>
					Save Playlist
				</button>
				<button
					id="delete-btn"
					class="py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
					data-id={playlist.id}
				>
					Delete
				</button>
			</div>
		</>
	) : (
		<div class="flex items-center justify-center h-full text-gray-400">
			<p>Select a playlist or create a new one</p>
		</div>
	)}
</div>
```

**Step 2: Commit**

```bash
git add app/src/components/PlaylistEditor.astro
git commit -m "feat: add PlaylistEditor component"
```

---

### Task 10: Redesign settings page

**Files:**
- Modify: `app/src/pages/settings.astro`

**Step 1: Redesign settings page with sidebar layout**

Replace entire `app/src/pages/settings.astro` with:

```astro
---
import Layout from '../layouts/main.astro';
import Toast from '../components/Toast.astro';
import PlaylistSidebar from '../components/PlaylistSidebar.astro';
import PlaylistEditor from '../components/PlaylistEditor.astro';
import { loadPlaylists } from '../lib/playlists';

const config = loadPlaylists();
const playlists = config.playlists;
const selectedId = config.activePlaylist || playlists[0]?.id || null;
const selectedPlaylist = playlists.find(p => p.id === selectedId) || null;
---

<Layout title="Settings - VidGrid">
	<div class="max-w-6xl mx-auto p-8">
		<h2 class="text-2xl font-bold mb-6">Stream Settings</h2>
		
		<div class="flex gap-6" style="height: calc(100vh - 200px);">
			<PlaylistSidebar playlists={playlists} selectedId={selectedId} />
			<PlaylistEditor playlist={selectedPlaylist} />
		</div>
	</div>
	
	<Toast />
</Layout>

<script>
	interface StreamSettings {
		topLeft: string;
		topRight: string;
		bottomLeft: string;
		bottomRight: string;
	}
	
	interface Playlist {
		id: string;
		name: string;
		icon: string;
		streams: StreamSettings;
	}
	
	interface PlaylistsConfig {
		activePlaylist: string;
		playlists: Playlist[];
	}
	
	let currentPlaylists: Playlist[] = [];
	let selectedId: string | null = null;
	
	async function loadPlaylists(): Promise<PlaylistsConfig> {
		const response = await fetch('/api/playlists');
		return response.json();
	}
	
	function showToast(message: string, type: 'success' | 'error') {
		(document as any).showToast(message, type);
	}
	
	async function createPlaylist() {
		const name = prompt('Enter playlist name:');
		if (!name) return;
		
		const response = await fetch('/api/playlists', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, icon: 'tv', streams: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' } }),
		});
		
		if (response.ok) {
			showToast('Playlist created', 'success');
			location.reload();
		} else {
			showToast('Failed to create playlist', 'error');
		}
	}
	
	async function savePlaylist(id: string) {
		const name = (document.getElementById('playlist-name') as HTMLInputElement).value;
		const icon = (document.getElementById('playlist-icon') as HTMLSelectElement).value;
		const streams: StreamSettings = {
			topLeft: (document.getElementById('topLeft') as HTMLInputElement).value,
			topRight: (document.getElementById('topRight') as HTMLInputElement).value,
			bottomLeft: (document.getElementById('bottomLeft') as HTMLInputElement).value,
			bottomRight: (document.getElementById('bottomRight') as HTMLInputElement).value,
		};
		
		const response = await fetch(`/api/playlists/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, icon, streams }),
		});
		
		if (response.ok) {
			showToast('Playlist saved', 'success');
		} else {
			showToast('Failed to save playlist', 'error');
		}
	}
	
	async function deletePlaylist(id: string) {
		if (!confirm('Are you sure you want to delete this playlist?')) return;
		
		const response = await fetch(`/api/playlists/${id}`, {
			method: 'DELETE',
		});
		
		if (response.ok) {
			showToast('Playlist deleted', 'success');
			location.reload();
		} else {
			showToast('Failed to delete playlist', 'error');
		}
	}
	
	function selectPlaylist(id: string) {
		window.location.href = `/settings?playlist=${id}`;
	}
	
	document.getElementById('new-playlist-btn')?.addEventListener('click', createPlaylist);
	
	document.getElementById('save-btn')?.addEventListener('click', (e) => {
		const id = (e.target as HTMLElement).dataset.id;
		if (id) savePlaylist(id);
	});
	
	document.getElementById('delete-btn')?.addEventListener('click', (e) => {
		const id = (e.target as HTMLElement).dataset.id;
		if (id) deletePlaylist(id);
	});
	
	document.querySelectorAll('.playlist-item').forEach((item) => {
		item.addEventListener('click', () => {
			const id = (item as HTMLElement).dataset.id;
			if (id) selectPlaylist(id);
		});
	});
</script>
```

**Step 2: Commit**

```bash
git add app/src/pages/settings.astro
git commit -m "feat: redesign settings page with sidebar + editor layout"
```

---

### Task 11: Remove old settings files

**Files:**
- Delete: `app/src/lib/settings.ts`
- Delete: `app/src/pages/api/settings.ts`

**Step 1: Delete old settings utility**

Run: `rm app/src/lib/settings.ts`

**Step 2: Delete old settings API**

Run: `rm app/src/pages/api/settings.ts`

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove old settings files, replaced by playlists"
```

---

### Task 12: Update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

**Step 1: Update documentation**

Replace the "Settings Storage" section in AGENTS.md with:

```markdown
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
```

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for playlist feature"
```

---

### Task 13: Final verification

**Step 1: Run build**

Run: `cd app && bun run build`

Expected: Build succeeds

**Step 2: Run TypeScript check**

Run: `cd app && bunx tsc --noEmit`

Expected: No errors

**Step 3: Manual testing**

Run: `cd app && bun run dev`

Test:
1. Visit `/settings` - should see sidebar with Default playlist
2. Edit Default playlist name/icon/streams, save
3. Create new playlist
4. Visit `/` - should see playlist buttons in header
5. Click different playlists, verify streams change
6. Refresh page - verify last selected playlist is remembered

**Step 4: Verify migration works**

Run: `rm storage/playlists.yaml` (if exists)

Then start dev server and verify old `videourls.yaml` is migrated to Default playlist.
