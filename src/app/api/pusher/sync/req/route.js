// 表示側の初期化時に、編集側に同期をリクエストするためのPusherの設定
import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET() {
  console.log("received sync request event:");
  try {
    await pusherServer.trigger("private-sync-request", "evt::sync-request", {
    });
    console.log("sync request event sent");

    return Response.json({ message: "sync request event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send sync request event", error: String(error) },
      { status: 500 }
    );
  }
}