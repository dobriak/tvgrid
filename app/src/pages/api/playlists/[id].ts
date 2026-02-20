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
