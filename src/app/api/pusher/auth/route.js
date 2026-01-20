// Pusher の認証を行う。クライアント側からPusherにリクエストが飛んだ際、Pusherからメインサーバに認証情報を要求される。
// プライベートチャネルの認証処理を行う
// ログイン認証処理が必要。
// 認証が成功したら、Pusher の認証情報を返す
import { getPusherInstance } from "@/app/utils/pusher/server";

const pusherServer = getPusherInstance();

export async function POST(req) {
    console.log("authenticating pusher perms...");
    const data = await req.text();
    const [socketId, channelName] = data
    .split("&")
    .map((str) => str.split("=")[1]);

    console.log("socketId:", socketId);
    console.log("channelName:", channelName);

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);

    return new Response(JSON.stringify(authResponse));
}