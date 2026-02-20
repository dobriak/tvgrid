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
