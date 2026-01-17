// 編集側のデータを表示側に同期するためのPusherの設定
import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { script, speaker_list, position, cueCardMode, prompterMode } = await req.json();
  try {
    await pusherServer.trigger("private-sync", "evt::sync", {
      script: script,
      speaker_list: speaker_list,
      position: position,
      cueCardMode: cueCardMode,
      prompterMode: prompterMode,
    });

    return Response.json({ message: "sync event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send sync event", error: String(error) },
      { status: 500 }
    );
  }
}