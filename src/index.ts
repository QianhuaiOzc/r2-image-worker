/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	BUCKET: R2Bucket;
}


export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Parse request URL
		const url = new URL(request.url);

		// Extract the image key from the path
		const path = url.pathname;
		if (!path.startsWith('/images/')) {
			return new Response('Invalid path. Must start with /images/', { status: 400 });
		}

		const imageKey = path.substring('/images/'.length);

		try {
			// Get the object from R2
			const object = await env.BUCKET.get(imageKey);

			if (!object) {
				return new Response('Image not found', { status: 404 });
			}

			// Get the image data
			const data = await object.arrayBuffer();

			// For R2 objects, we need to create a new Response with the transformed image
			const response = new Response(data, {
				headers: {
					'Content-Type': object.httpMetadata?.contentType || 'image/png',
					'Cache-Control': 'public, max-age=31536000',
				}
			});

			return response;
		} catch (err: any) {
			return new Response('Error processing image: ' + err.message, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
