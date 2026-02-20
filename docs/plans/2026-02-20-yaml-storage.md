# YAML Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace browser localStorage with server-side YAML file storage for video stream URLs.

**Architecture:** Create Astro API endpoints to read/write a YAML file at `storage/videourls.yaml`. The frontend will call these endpoints instead of using localStorage. This enables persistent server-side configuration.

**Tech Stack:** Astro API routes, js-yaml library, TypeScript

---

### Task 1: Add YAML dependency

**Files:**
- Modify: `app/package.json`

**Step 1: Install js-yaml**

Run: `cd app && bun add js-yaml && bun add -d @types/js-yaml`

Expected: Package added to dependencies

**Step 2: Verify installation**

Run: `cd app && bun pm ls | grep yaml`

Expected: `js-yaml@<version>`

**Step 3: Commit**

```bash
git add app/package.json app/bun.lock
git commit -m "chore: add js-yaml dependency for config storage"
```

---

### Task 2: Create storage directory and initial YAML file

**Files:**
- Create: `storage/videourls.yaml`
- Create: `storage/.gitkeep`

**Step 1: Create storage directory**

Run: `mkdir -p /Users/julian/development/playground/vidgrid/storage`

**Step 2: Create initial YAML file**

Create file `storage/videourls.yaml`:

```yaml
topLeft: ""
topRight: ""
bottomLeft: ""
bottomRight: ""
```

**Step 3: Add .gitkeep for backup awareness**

Create file `storage/.gitkeep` (empty file)

**Step 4: Commit**

```bash
git add storage/
git commit -m "chore: create storage directory for video URLs"
```

---

### Task 3: Create shared types and storage utilities

**Files:**
- Create: `app/src/lib/settings.ts`

**Step 1: Create settings utility module**

Create file `app/src/lib/settings.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';

export interface StreamSettings {
	topLeft: string;
	topRight: string;
	bottomLeft: string;
	bottomRight: string;
}

const DEFAULT_SETTINGS: StreamSettings = {
	topLeft: '',
	topRight: '',
	bottomLeft: '',
	bottomRight: '',
};

function getStoragePath(): string {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const projectRoot = join(__dirname, '..', '..', '..', '..', 'storage');
	return join(projectRoot, 'videourls.yaml');
}

export function loadSettings(): StreamSettings {
	const filePath = getStoragePath();
	
	if (!existsSync(filePath)) {
		const dir = dirname(filePath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		return { ...DEFAULT_SETTINGS };
	}
	
	try {
		const content = readFileSync(filePath, 'utf-8');
		const data = yaml.load(content) as Partial<StreamSettings>;
		return { ...DEFAULT_SETTINGS, ...data };
	} catch (e) {
		console.error('Failed to load settings:', e);
		return { ...DEFAULT_SETTINGS };
	}
}

export function saveSettings(settings: StreamSettings): boolean {
	const filePath = getStoragePath();
	const dir = dirname(filePath);
	
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	
	try {
		const content = yaml.dump(settings);
		writeFileSync(filePath, content, 'utf-8');
		return true;
	} catch (e) {
		console.error('Failed to save settings:', e);
		return false;
	}
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd app && bunx tsc --noEmit`

Expected: No errors

**Step 3: Commit**

```bash
git add app/src/lib/settings.ts
git commit -m "feat: add settings utility for YAML storage"
```

---

### Task 4: Create API endpoint for getting settings

**Files:**
- Create: `app/src/pages/api/settings.ts`

**Step 1: Create GET endpoint**

Create file `app/src/pages/api/settings.ts`:

```typescript
import type { APIRoute } from 'astro';
import { loadSettings, saveSettings, type StreamSettings } from '../../lib/settings';

export const GET: APIRoute = async () => {
	const settings = loadSettings();
	return new Response(JSON.stringify(settings), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

export const PUT: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const settings = body as StreamSettings;
		
		if (!settings.topLeft && !settings.topRight && !settings.bottomLeft && !settings.bottomRight) {
			return new Response(JSON.stringify({ error: 'Invalid settings format' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		
		const success = saveSettings(settings);
		
		if (success) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		} else {
			return new Response(JSON.stringify({ error: 'Failed to save settings' }), {
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

**Step 2: Verify build succeeds**

Run: `cd app && bun run build`

Expected: Build completes without errors

**Step 3: Commit**

```bash
git add app/src/pages/api/settings.ts
git commit -m "feat: add API endpoints for settings CRUD"
```

---

### Task 5: Update VideoGrid.astro to use API

**Files:**
- Modify: `app/src/components/VideoGrid.astro`

**Step 1: Replace localStorage with API fetch**

Update the `<script>` block in `app/src/components/VideoGrid.astro` (lines 20-57):

```astro
<script>
	interface StreamSettings {
		topLeft: string;
		topRight: string;
		bottomLeft: string;
		bottomRight: string;
	}
	
	async function loadSettings(): Promise<StreamSettings> {
		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				return await response.json();
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
		return { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' };
	}
	
	loadSettings().then((settings) => {
		document.querySelectorAll('.video-cell').forEach((cell) => {
			const key = (cell as HTMLElement).dataset.key as keyof StreamSettings;
			const url = settings[key];
			const player = cell.querySelector('.video-player');
			
			if (player && url) {
				(player as HTMLElement).dataset.url = url;
				player.dispatchEvent(new CustomEvent('url-update', { detail: { url } }));
			}
		});
	});
</script>
```

**Step 2: Verify build succeeds**

Run: `cd app && bun run build`

Expected: Build completes without errors

**Step 3: Commit**

```bash
git add app/src/components/VideoGrid.astro
git commit -m "refactor: use API instead of localStorage in VideoGrid"
```

---

### Task 6: Update settings.astro to use API

**Files:**
- Modify: `app/src/pages/settings.astro`

**Step 1: Replace localStorage with API fetch**

Update the `<script>` block in `app/src/pages/settings.astro` (lines 48-114):

```astro
<script>
	interface StreamSettings {
		topLeft: string;
		topRight: string;
		bottomLeft: string;
		bottomRight: string;
	}
	
	async function loadSettings(): Promise<StreamSettings> {
		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				return await response.json();
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
		return { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' };
	}
	
	async function saveSettings(settings: StreamSettings): Promise<boolean> {
		try {
			const response = await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings),
			});
			return response.ok;
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
	
	loadSettings().then(populateForm);
	
	const form = document.getElementById('settings-form');
	if (form) {
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			
			const formData = new FormData(form as HTMLFormElement);
			const newSettings: StreamSettings = {
				topLeft: formData.get('topLeft') as string || '',
				topRight: formData.get('topRight') as string || '',
				bottomLeft: formData.get('bottomLeft') as string || '',
				bottomRight: formData.get('bottomRight') as string || '',
			};
			
			if (await saveSettings(newSettings)) {
				(document as any).showToast('Settings Saved', 'success');
			} else {
				(document as any).showToast('Failed to save settings', 'error');
			}
		});
	}
</script>
```

**Step 2: Verify build succeeds**

Run: `cd app && bun run build`

Expected: Build completes without errors

**Step 3: Commit**

```bash
git add app/src/pages/settings.astro
git commit -m "refactor: use API instead of localStorage in settings page"
```

---

### Task 7: Update AGENTS.md documentation

**Files:**
- Modify: `AGENTS.md`

**Step 1: Update Local Storage Schema section**

Replace the "Local Storage Schema" section in `AGENTS.md` with:

```markdown
### Settings Storage

Video stream URLs are stored in `storage/videourls.yaml`:

```yaml
topLeft: "https://example.com/stream1.m3u8"
topRight: ""
bottomLeft: "https://example.com/stream2.m3u8"
bottomRight: ""
```

API endpoints:
- `GET /api/settings` - Retrieve current settings
- `PUT /api/settings` - Update settings (JSON body)
```

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update storage documentation for YAML backend"
```

---

### Task 8: Final verification

**Step 1: Run full build**

Run: `cd app && bun run build`

Expected: Build succeeds with no errors

**Step 2: Run TypeScript check**

Run: `cd app && bunx tsc --noEmit`

Expected: No type errors

**Step 3: Test manually**

Run: `cd app && bun run dev`

Then:
1. Navigate to `http://localhost:4321/settings`
2. Enter stream URLs and save
3. Navigate to `http://localhost:4321/`
4. Verify videos load with saved URLs
5. Check `storage/videourls.yaml` contains saved values

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve any remaining issues"
```
