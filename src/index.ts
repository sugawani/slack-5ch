import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";
import { SlashCommand } from "slack-edge";

export interface Env extends SlackEdgeAppEnv {
  POST_CHANNEL_ID: string;
  responses: KVNamespace;
}

const makeID = (): string => {
  return `${Math.random().toString(36).slice(2,8)}0`;
}

const fetchResponseID = async (env: Env): Promise<number> => {
  const id = await env.responses.get("id");
  return id != null ? parseInt(id) : 1;
}

const incrementResponseID = (env: Env, currentID: number): void => {
  env.responses.put("id", `${currentID+1}`);
}

const getToday5chFormat = (): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2
  }).format(new Date());
}

const getUsername = (payload: SlashCommand): string => {
  if (payload.text.includes("fushianasan")) {
    return payload.user_id;
  }
  return "名無しさん";
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp({ env });
    const responseID = await fetchResponseID(env);
    incrementResponseID(env, responseID);
    app.command("/anonymous-chat", async ({ context, payload}) => {
      await context.client.chat.postMessage({
        username: `${responseID} ${getUsername(payload)} ${getToday5chFormat()} ID:${makeID()}`,
        channel: env.POST_CHANNEL_ID,
        text: payload.text,
      });
    });
    return await app.run(request, ctx);
  },
};
