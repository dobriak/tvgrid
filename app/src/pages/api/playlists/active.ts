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
