// Pusher の認証を行う。クライアント側からPusherにリクエストが飛んだ際、Pusherからメインサーバに認証情報を要求される。
// プライベートチャネルの認証処理を行う
// ログイン認証処理が必要。
// 認証が成功したら、Pusher の認証情報を返す
import { getPusherInstance } from "@/app/utils/pusher/server";

const pusherServer = getPusherInstance();

export async function POST(req) {
    console.log("authenticating pusher perms...");
    const data = await req.text();
    const params = new URLSearchParams(data);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    console.log("socketId:", socketId);
    console.log("channelName:", channelName);

    if (!socketId || !channelName) {
        return new Response(JSON.stringify({ message: "Invalid auth request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);

    return new Response(JSON.stringify(authResponse), {
        headers: { "Content-Type": "application/json" },
    });
}