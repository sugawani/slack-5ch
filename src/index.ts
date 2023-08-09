import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env extends SlackEdgeAppEnv {
  POST_CHANNEL_ID: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp({ env });
    app.command("/hey-cf-workers", async ({ context, payload}) => {
		await context.client.chat.postMessage({
			channel: env.POST_CHANNEL_ID,
			text: payload.text
		})
	});
    return await app.run(request, ctx);
  },
};
