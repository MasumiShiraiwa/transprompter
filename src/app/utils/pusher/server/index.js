// サーバ側で利用するPusherの設定
import PusherServer from "pusher"; //Pusher の HTTP Application Programming Interface を叩くための SDK
// WebSocket 接続はしない
// 「このイベントを配信して」と 命令する(pusher.trigger)側

let pusherInstance = null;

export const getPusherInstance = () => {
  if (!pusherInstance) {
    pusherInstance = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherInstance;
};