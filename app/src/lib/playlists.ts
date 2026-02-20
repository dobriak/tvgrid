import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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
