import { Router } from 'itty-router';
import {
	InteractionResponseType,
	InteractionType,
	verifyKey,
} from 'discord-interactions';
import { HELP_COMMAND } from './commands.js';

class JsonResponse extends Response {
	constructor(body, init) {
		const json_body = JSON.stringify(body);
		init = init || {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(json_body, init);
	}
}

const router = Router();

router.get('/', () => {
	return new Response(`👋 GitBot`);
});

router.post('/interactions', async (request) => {
	const message = await request.json();
	if (message.type === InteractionType.PING) {
		// The PING message type is used during the initial webhook handshake
		console.log('Handling PING request...');
		return new JsonResponse({
			type: InteractionResponseType.PONG,
		});
	}

	let command_name;
	if (message.type === InteractionType.APPLICATION_COMMAND) {
		switch ((command_name = message.data.name.toLowerCase())) {
			case HELP_COMMAND.name.toLowerCase():
				return new JsonResponse({
					type: 4,
					data: {
						embeds: [
							{
								title: 'GitBot Help',
								url: 'https://discord.statch.org',
								color: 0x2f3136,
								description:
									":tada:  **Hi, I'm GitBot!**\nAll of my commands *(well, except this one I guess)* are message-based!\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n<:circle_yes:772431025187848192>  **To get started, type:**\n```haskell\ngit help```",
								footer: {
									text: 'Click on the title to join the support server!',
									icon_url:
										'https://cdn.discordapp.com/avatars/761269120691470357/16ce15aba9ea981b3129d00e317bbea1.png?size=512',
								},
							},
						],
					},
				});
			default:
				console.error(`Unknown Command ${command_name}`);
				return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
		}
	}

	console.error('Unknown Type');
	return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
	/**
	 * @param {*} request A Fetch Request object
	 * @param {*} env A map of key/value pairs with env vars and secrets from the cloudflare env.
	 * @returns
	 */
	async fetch(request, env) {
		if (request.method === 'POST' && request.url === '/interactions') {
			const signature = request.headers.get('x-signature-ed25519');
			const timestamp = request.headers.get('x-signature-timestamp');
			console.log(
				`sig: ${signature}; ts: ${timestamp}; pubkey: ${env.DISCORD_PUBLIC_KEY}`
			);
			const body = await request.clone().arrayBuffer();
			const isValidRequest = verifyKey(
				body,
				signature,
				timestamp,
				env.DISCORD_PUBLIC_KEY
			);
			if (!isValidRequest) {
				console.error('Invalid Request');
				return new Response('Bad request signature.', { status: 401 });
			}
		}

		return router.handle(request, env);
	},
};
