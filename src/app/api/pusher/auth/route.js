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