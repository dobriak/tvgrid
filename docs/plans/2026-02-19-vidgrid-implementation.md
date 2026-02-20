# VidGrid Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 2x2 video streaming grid application with settings persistence via LocalStorage.

**Architecture:** Two Astro pages (Play, Settings) sharing a Header component. VideoPlayer handles native MP4/WebM and HLS streams via HLS.js. Settings stored in LocalStorage with no backend.

**Tech Stack:** Astro 5.x, Tailwind CSS 4.x, HLS.js, Bun, TypeScript

---

## Phase 1: Core Structure

### Task 1: Add HLS.js Dependency

**Files:**
- Modify: `app/package.json`

**Step 1: Install HLS.js**

Run from `app/` directory:
```bash
cd app && bun add hls.js
```

**Step 2: Verify installation**

Run: `cat app/package.json`
Expected: `"hls.js"` in dependencies

**Step 3: Commit**

```bash
git add app/package.json app/bun.lock
git commit -m "feat: add hls.js dependency for HLS stream support"
```

---

### Task 2: Create Header Component

**Files:**
- Create: `app/src/components/Header.astro`

**Step 1: Create Header.astro**

```astro
---
const currentPath = Astro.url.pathname;
---

<header class="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
	<h1 class="text-xl font-bold">VidGrid</h1>
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
git commit -m "feat: add Header component with navigation"
```

---

### Task 3: Update Main Layout

**Files:**
- Modify: `app/src/layouts/main.astro`

**Step 1: Add Header to layout**

Replace content with:

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
const { title = 'VidGrid' } = Astro.props;
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="icon" href="/favicon.ico" />
		<title>{title}</title>
	</head>
	<body class="bg-gray-950 text-white min-h-screen">
		<Header />
		<main>
			<slot />
		</main>
	</body>
</html>
```

**Step 2: Verify build**

Run: `cd app && bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/src/layouts/main.astro
git commit -m "feat: integrate Header into main layout"
```

---

### Task 4: Create Placeholder Settings Page

**Files:**
- Create: `app/src/pages/settings.astro`

**Step 1: Create settings.astro**

```astro
---
import Layout from '../layouts/main.astro';
---

<Layout title="Settings - VidGrid">
	<div class="max-w-2xl mx-auto p-8">
		<h2 class="text-2xl font-bold mb-6">Stream Settings</h2>
		<p class="text-gray-400">Configure your video stream URLs below.</p>
	</div>
</Layout>
```

**Step 2: Verify page loads**

Run: `cd app && bun run dev`
Navigate to: `http://localhost:4321/settings`

**Step 3: Commit**

```bash
git add app/src/pages/settings.astro
git commit -m "feat: add placeholder Settings page"
```

---

### Task 5: Update Index Page

**Files:**
- Modify: `app/src/pages/index.astro`

**Step 1: Replace index.astro content**

```astro
---
import Layout from '../layouts/main.astro';
---

<Layout title="VidGrid">
	<div class="p-4 h-[calc(100vh-72px)]">
		<div class="grid grid-cols-2 grid-rows-2 gap-2 h-full">
			<div class="bg-gray-800 rounded-lg flex items-center justify-center">
				<span class="text-gray-500">Top Left</span>
			</div>
			<div class="bg-gray-800 rounded-lg flex items-center justify-center">
				<span class="text-gray-500">Top Right</span>
			</div>
			<div class="bg-gray-800 rounded-lg flex items-center justify-center">
				<span class="text-gray-500">Bottom Left</span>
			</div>
			<div class="bg-gray-800 rounded-lg flex items-center justify-center">
				<span class="text-gray-500">Bottom Right</span>
			</div>
		</div>
	</div>
</Layout>
```

**Step 2: Verify grid layout**

Run: `cd app && bun run dev`
Navigate to: `http://localhost:4321/`
Expected: 2x2 grid visible

**Step 3: Commit**

```bash
git add app/src/pages/index.astro
git commit -m "feat: add 2x2 grid placeholder to Play page"
```

---

## Phase 2: Settings Page

### Task 6: Create Toast Component

**Files:**
- Create: `app/src/components/Toast.astro`

**Step 1: Create Toast.astro**

```astro
---
// Toast component - controlled via client-side script
---

<div
	id="toast"
	class="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none"
	data-type="success"
>
	<span id="toast-message"></span>
</div>

<script>
	function showToast(message: string, type: 'success' | 'error' = 'success') {
		const toast = document.getElementById('toast');
		const toastMessage = document.getElementById('toast-message');
		
		if (!toast || !toastMessage) return;
		
		toastMessage.textContent = message;
		toast.className = toast.className
			.replace(/bg-\w+-\d+/g, '')
			.replace('translate-y-20', 'translate-y-0')
			.replace('opacity-0', 'opacity-100');
		
		if (type === 'success') {
			toast.classList.add('bg-green-600');
		} else {
			toast.classList.add('bg-red-600');
		}
		
		setTimeout(() => {
			toast.classList.remove('translate-y-0', 'opacity-100');
			toast.classList.add('translate-y-20', 'opacity-0');
		}, 2500);
	}
	
	(document as any).showToast = showToast;
</script>
```

**Step 2: Commit**

```bash
git add app/src/components/Toast.astro
git commit -m "feat: add Toast notification component"
```

---

### Task 7: Implement Settings Form

**Files:**
- Modify: `app/src/pages/settings.astro`

**Step 1: Replace settings.astro content**

```astro
---
import Layout from '../layouts/main.astro';
import Toast from '../components/Toast.astro';

const positions = [
	{ key: 'topLeft', label: 'Top Left' },
	{ key: 'topRight', label: 'Top Right' },
	{ key: 'bottomLeft', label: 'Bottom Left' },
	{ key: 'bottomRight', label: 'Bottom Right' },
];
---

<Layout title="Settings - VidGrid">
	<div class="max-w-2xl mx-auto p-8">
		<h2 class="text-2xl font-bold mb-6">Stream Settings</h2>
		
		<form id="settings-form" class="space-y-6">
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
						placeholder="https://example.com/stream.m3u8"
						class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					/>
				</div>
			))}
			
			<button
				type="submit"
				class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
			>
				Save Settings
			</button>
		</form>
	</div>
	
	<Toast />
</Layout>

<script>
	const STORAGE_KEY = 'vidgrid-settings';
	
	interface StreamSettings {
		topLeft: string;
		topRight: string;
		bottomLeft: string;
		bottomRight: string;
	}
	
	function loadSettings(): StreamSettings {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
		return { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' };
	}
	
	function saveSettings(settings: StreamSettings): boolean {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
			return true;
		} catch (e) {
			console.error('Failed to save settings:', e);
			return false;
		}
	}
	
	function populateForm(settings: StreamSettings) {
		Object.entries(settings).forEach(([key, value]) => {
			const input = document.getElementById(key) as HTMLInputElement;
			if (input) {
				input.value = value;
			}
		});
	}
	
	// Load settings on page load
	const settings = loadSettings();
	populateForm(settings);
	
	// Handle form submission
	const form = document.getElementById('settings-form');
	if (form) {
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			
			const formData = new FormData(form as HTMLFormElement);
			const newSettings: StreamSettings = {
				topLeft: formData.get('topLeft') as string || '',
				topRight: formData.get('topRight') as string || '',
				bottomLeft: formData.get('bottomLeft') as string || '',
				bottomRight: formData.get('bottomRight') as string || '',
			};
			
			if (saveSettings(newSettings)) {
				(document as any).showToast('Settings Saved', 'success');
			} else {
				(document as any).showToast('Failed to save settings', 'error');
			}
		});
	}
</script>
```

**Step 2: Test settings persistence**

Run: `cd app && bun run dev`
Navigate to: `http://localhost:4321/settings`
Enter URLs, click Save, verify toast appears
Refresh page, verify URLs persist

**Step 3: Commit**

```bash
git add app/src/pages/settings.astro
git commit -m "feat: implement Settings form with localStorage persistence"
```

---

## Phase 3: Play Page & Video Player

### Task 8: Create VideoPlayer Component

**Files:**
- Create: `app/src/components/VideoPlayer.astro`

**Step 1: Create VideoPlayer.astro**

```astro
---
interface Props {
	position: string;
	url?: string;
}
const { position, url } = Astro.props;
const hasUrl = url && url.trim() !== '';
---

<div class="video-player relative w-full h-full bg-gray-800 rounded-lg overflow-hidden" data-position={position} data-url={url || ''}>
	{hasUrl ? (
		<video
			class="w-full h-full object-contain"
			muted
			playsinline
			controlslist="nodownload"
		>
			<source src={url} type="video/mp4" />
			<source src={url} type="video/webm" />
		</video>
	) : (
		<div class="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
			<svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
			</svg>
			<span class="text-sm">No Stream Configured</span>
		</div>
	)}
	
	<!-- Error overlay (hidden by default) -->
	<div class="error-overlay hidden absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center text-gray-300">
		<svg class="w-12 h-12 mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
		</svg>
		<span class="text-sm mb-3">Stream Unavailable</span>
		<button class="retry-btn px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors">
			Retry
		</button>
	</div>
	
	<!-- Hover controls hint -->
	<div class="controls-hint absolute bottom-2 right-2 text-xs text-gray-400 opacity-0 transition-opacity pointer-events-none">
		Hover for controls
	</div>
</div>

<script>
	import Hls from 'hls.js';
	
	document.querySelectorAll('.video-player').forEach((player) => {
		const video = player.querySelector('video');
		const url = (player as HTMLElement).dataset.url;
		const errorOverlay = player.querySelector('.error-overlay');
		const retryBtn = player.querySelector('.retry-btn');
		const controlsHint = player.querySelector('.controls-hint');
		
		if (!video || !url) return;
		
		// Show controls hint on hover
		player.addEventListener('mouseenter', () => {
			if (controlsHint) {
				controlsHint.classList.remove('opacity-0');
				controlsHint.classList.add('opacity-100');
			}
			video.controls = true;
		});
		
		player.addEventListener('mouseleave', () => {
			if (controlsHint) {
				controlsHint.classList.remove('opacity-100');
				controlsHint.classList.add('opacity-0');
			}
			video.controls = false;
		});
		
		function showError() {
			if (errorOverlay) {
				errorOverlay.classList.remove('hidden');
			}
		}
		
		function hideError() {
			if (errorOverlay) {
				errorOverlay.classList.add('hidden');
			}
		}
		
		function initVideo() {
			hideError();
			
			const isHLS = url.includes('.m3u8');
			
			if (isHLS) {
				if (Hls.isSupported()) {
					const hls = new Hls();
					hls.loadSource(url);
					hls.attachMedia(video);
					
					hls.on(Hls.Events.ERROR, () => {
						showError();
					});
					
					hls.on(Hls.Events.MANIFEST_PARSED, () => {
						hideError();
					});
				} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
					// Safari native HLS support
					video.src = url;
				}
			} else {
				video.src = url;
			}
		}
		
		// Handle video errors
		video.addEventListener('error', showError);
		
		// Retry button
		if (retryBtn) {
			retryBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				initVideo();
			});
		}
		
		// Initialize
		initVideo();
	});
</script>
```

**Step 2: Commit**

```bash
git add app/src/components/VideoPlayer.astro
git commit -m "feat: add VideoPlayer component with HLS.js support"
```

---

### Task 9: Create VideoGrid Component

**Files:**
- Create: `app/src/components/VideoGrid.astro`

**Step 1: Create VideoGrid.astro**

```astro
---
import VideoPlayer from './VideoPlayer.astro';

const positions = [
	{ key: 'topLeft', label: 'Top Left' },
	{ key: 'topRight', label: 'Top Right' },
	{ key: 'bottomLeft', label: 'Bottom Left' },
	{ key: 'bottomRight', label: 'Bottom Right' },
];
---

<div class="video-grid grid grid-cols-2 grid-rows-2 gap-2 h-full">
	{positions.map((pos) => (
		<div class="video-cell" data-key={pos.key}>
			<VideoPlayer position={pos.key} />
		</div>
	))}
</div>

<script>
	const STORAGE_KEY = 'vidgrid-settings';
	
	interface StreamSettings {
		topLeft: string;
		topRight: string;
		bottomLeft: string;
		bottomRight: string;
	}
	
	function loadSettings(): StreamSettings {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
		return { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' };
	}
	
	// Load settings and update video players
	const settings = loadSettings();
	
	document.querySelectorAll('.video-cell').forEach((cell) => {
		const key = (cell as HTMLElement).dataset.key as keyof StreamSettings;
		const url = settings[key];
		const player = cell.querySelector('.video-player');
		
		if (player && url) {
			(player as HTMLElement).dataset.url = url;
			
			// Dispatch custom event to notify VideoPlayer
			player.dispatchEvent(new CustomEvent('url-update', { detail: { url } }));
		}
	});
</script>
```

**Step 2: Commit**

```bash
git add app/src/components/VideoGrid.astro
git commit -m "feat: add VideoGrid component with localStorage integration"
```

---

### Task 10: Integrate VideoGrid into Play Page

**Files:**
- Modify: `app/src/pages/index.astro`

**Step 1: Replace index.astro content**

```astro
---
import Layout from '../layouts/main.astro';
import VideoGrid from '../components/VideoGrid.astro';
---

<Layout title="VidGrid">
	<div class="p-4 h-[calc(100vh-72px)]">
		<VideoGrid />
	</div>
</Layout>
```

**Step 2: Test full flow**

Run: `cd app && bun run dev`
1. Navigate to Settings, add test URLs
2. Navigate to Play, verify videos load
3. Test with HLS URL and MP4 URL

**Step 3: Commit**

```bash
git add app/src/pages/index.astro
git commit -m "feat: integrate VideoGrid into Play page"
```

---

## Phase 4: Error Handling & Polish

### Task 11: Remove Demo Files

**Files:**
- Delete: `app/src/components/Button.astro`
- Delete: `app/src/pages/markdown-page.md`

**Step 1: Delete unused files**

```bash
rm app/src/components/Button.astro
rm app/src/pages/markdown-page.md
```

**Step 2: Verify build**

Run: `cd app && bun run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove demo files (Button, markdown-page)"
```

---

### Task 12: Final Build Verification

**Step 1: Run production build**

Run: `cd app && bun run build`
Expected: Build succeeds

**Step 2: Preview production build**

Run: `cd app && bun run preview`
Test all functionality:
- Navigation between pages
- Settings persistence
- Video playback (native and HLS)
- Error states

**Step 3: Final commit (if any fixes needed)**

```bash
git status
# If changes exist:
git add -A
git commit -m "fix: final polish and fixes"
```

---

## Verification Checklist

Before marking complete, verify:

- [ ] `bun run build` succeeds with no errors
- [ ] Play page displays 2x2 grid
- [ ] Settings page saves URLs to localStorage
- [ ] Settings persist across page reloads
- [ ] Native video (MP4/WebM) plays correctly
- [ ] HLS streams (.m3u8) play via HLS.js
- [ ] Videos default to muted
- [ ] Video controls appear on hover
- [ ] "No Stream Configured" shown for empty slots
- [ ] Error overlay with retry for failed streams
- [ ] Toast notification on settings save
- [ ] Navigation between Play and Settings works
