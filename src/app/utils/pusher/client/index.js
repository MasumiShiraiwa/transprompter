// クライアント側で利用するPusherの設定
import PusherClient from "pusher-js"; //ブラウザで WebSocket 接続を張るための SDK
// イベントを「受信」する
// WebSocket 接続を確立し、チャンネルを subscribe する

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  // authEndpoint は　Pusher がプライベートチャネルの認証を要求するサーバー側のルート
  authEndpoint: "/api/pusher/auth",
});
