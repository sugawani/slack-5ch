import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";

export interface Env extends SlackEdgeAppEnv {
  POST_CHANNEL_ID: string;
}

function makeID(): string {
  return `${Math.random().toString(36).slice(2,8)}0`;
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
      username: `以下、名無しに変わりましてVIPがお送りします ID:${makeID()}`,
      channel: env.POST_CHANNEL_ID,
      text: payload.text,
    })
  });
    return await app.run(request, ctx);
  },
};
