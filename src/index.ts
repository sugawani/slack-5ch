import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";
import { SlashCommand } from "slack-edge";
export { IDCounter } from "./IDCounter";

export interface Env extends SlackEdgeAppEnv {
  POST_CHANNEL_ID: string;
  ID_COUNTER: DurableObjectNamespace;
  DB: D1Database;
}

const makeID = (): string => {
  return `${Math.random().toString(36).slice(2, 8)}0`;
};

const getToday5chFormat = (): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  }).format(new Date());
};

const getUsername = (payload: SlashCommand): string => {
  if (payload.text.includes("fusianasan")) {
    return payload.user_id;
  }
  return "名無しさん";
};

const fetchCurrentResponseID = async (
  req: Request,
  env: Env,
): Promise<number> => {
  const doID = env.ID_COUNTER.idFromName("id");
  const counter = env.ID_COUNTER.get(doID);
  const res = await counter.fetch(req.url);
  return parseInt(await res.text());
};

const insertPostMessage = async (db: D1Database, payload: SlashCommand, res_id: number): Promise<void> => {
  const now = (new Date()).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const result = await db.prepare("INSERT INTO post_messages (res_id, user_id, text, created_at) values (?, ?, ?, ?)").
    bind(res_id, payload.user_id, payload.text, now).
    run();
  if (!result.success) {
    console.error(result.error);
  }
}

const commandRegex = /\/(5ch|vip)/;

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp({ env });
    const responseID = await fetchCurrentResponseID(request, env);
    app.command(commandRegex, async ({ context, payload }) => {
      await context.client.chat.postMessage({
        username: `${responseID} ${
          getUsername(payload)
        } ${getToday5chFormat()} ID:${makeID()}`,
        channel: env.POST_CHANNEL_ID,
        text: payload.text,
      });
      await insertPostMessage(env.DB, payload, responseID);
    });
    return await app.run(request, ctx);
  },
};
