# slack-5ch

Slack 上で2ちゃんねる(5ちゃんねる)のように匿名でチャットが出来るようになるアプリです  
以下技術で動いています  
- Cloudflare Workers
- Cloudflare Durable Objects
- Cloudflare D1
- https://github.com/seratch/slack-cloudflare-workers
- wrangler

# 使い方

以下の前提です
- wrangler インストール済み
- wrangler login 実行済み
- cloudflare workers paid plan(Durable Object 使っているため)  
※一応最後の方に無料で使う方法も書いてます

## cloudflare workers へのデプロイ
### d1 database の作成

1. `wrangler d1 create post_messages` を実行しメッセージを保存する D1 Database 作成
2. コンソールに出力された `database_id` を `wrangler.toml` に反映
3. `wrangler d1 execute DB --file=./migrations/schema.sql` で DDL を実行し本番環境に D1 Database を作成

### デプロイ

1. `wrangler deploy` を実行
2. デプロイ完了で URL が表示されると思うのでメモしておく  
-> slack app の作成時に使います

## slack app を作成

1. https://api.slack.com/apps から Create New App を選択
2. From an app manifest を選択
3. `slack-app-manifest-example.yml` の内容を貼り付け  
`https://your-cloudflare-workers-url` となっている部分は、デプロイ済みの cloudflare workers の URL に変更してください
4. Basic Information -> Install to Workspace でアプリをインストール
5. Bot User OAuth Token が表示するのでメモ
6. Basic Information -> App Credentials -> Signing Secret をメモ

## 匿名チャットメッセージを投稿するチャンネル ID を取得

1. チャンネルを作成または任意のチャンネルの既存のチャンネルの詳細からチャンネル ID を取得してメモしておく  
画面上部のチャンネル名をクリックし、最下部までスクロールすると `Channel ID: XXXXX` の形で記載されています

## 環境変数の設定

1. `wrangler secret put SLACK_SIGNING_SECRET` で先程メモした Signing Secret を設定
2. `wrangler secret put SLACK_BOT_TOKEN` で先程メモした Bot User OAuth Token を設定
3. `wrangler secret put POST_CHANNEL_ID` で先程メモしたチャンネル ID を設定

## 匿名チャットを送信

`/5ch メッセージ` or `/vip メッセージ` で送信出来ます  
ENJOY!

## ローカル実行  
### d1 database の作成

`wrangler d1 execute DB --local --file=./migrations/schema.sql` で Miniflare の SQLite に DDL を実行

### 環境変数の設定

1. `cp .dev.vars.example .dev.vars`
2. 各環境変数を書き換える

### cloudflared を通して dev サーバーを公開できるようにする  

1. https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ をインストール  
Mac の場合は `brew install cloudflare/cloudflare/cloudflared` で OK
2. `wrangler dev` を実行
`[mf:inf] Ready on http://127.0.0.1:8787/` のような表示が出たら OK
3. `cloudflared tunnel --url http://localhost:8787` を実行
4. 以下のように URL が表示されたら OK
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://era-womens-another-conferences.trycloudflare.com                                  |
 +-------------------------------------------------------------------------------------------
```

### slack app の URL を変更

1. https://api.slack.com/apps から slack-5ch を選択
2. Slash Commands から各コマンドの URL を cloudflared に表示されている URL に変更

ENJOY!

## 無料で使いたい場合  
### ID がなくてもいい場合  

以下のように `index.ts` を編集してみてください  
ID は表示されませんが動くと思います  
```diff ts:index.ts
import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";
import { SlashCommand } from "slack-edge";
- export { IDCounter } from "./IDCounter";

export interface Env extends SlackEdgeAppEnv {
  POST_CHANNEL_ID: string;
  ID_COUNTER: DurableObjectNamespace;
-  DB: D1Database;
}
```
```diff ts:index.ts
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const app = new SlackApp({ env });
-    const responseID = await fetchCurrentResponseID(request, env);
    app.command(commandRegex, async ({ context, payload }) => {
      await context.client.chat.postMessage({
-        username: `${responseID} ${
+        username: `${
          getUsername(payload)
        } ${getToday5chFormat()} ID:${makeID()}`,
        channel: env.POST_CHANNEL_ID,
        text: payload.text,
      });
-      await insertPostMessage(env.DB, payload, responseID);
+      await insertPostMessage(env.DB, payload, 1);
    });
    return await app.run(request, ctx);
  },
};
```

### ID が欲しい場合  
https://github.com/sugawani/slack-5ch/commit/ab610ca38df03c7d086c709feee2f06586f55b89  
この辺のコミットを参考に KV で動かしてみてください