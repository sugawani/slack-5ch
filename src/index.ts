import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";
import md5 from "md5";

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

function todayString(): string {
  const today = new Date();
  return `${today.getFullYear()}${today.getMonth()}${today.getDay()}`
}

function makeID(userID: string): string {
  const today = todayString();
  return `${md5(today+userID).slice(0, 7)}0`;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp({ env });
    app.command("/anonymous-chat", async ({ context, payload}) => {
		await context.client.chat.postMessage({
			username: `以下、名無しに変わりましてVIPがお送りします ID:${makeID(payload.user_id)}`,
			channel: env.POST_CHANNEL_ID,
			text: payload.text,
		})
	});
    return await app.run(request, ctx);
  },
};
