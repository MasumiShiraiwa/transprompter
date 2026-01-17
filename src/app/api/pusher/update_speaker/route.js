// スピーカー更新イベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { globalIdx, speaker } = await req.json();
  console.log("received update_speaker event:", globalIdx, speaker);
  try {
    await pusherServer.trigger("private-update-speaker", "evt::update-speaker", {
      globalIdx: globalIdx,
      speaker: speaker,
    });
    console.log("update_speaker event sent");

    return Response.json({ message: "update_speaker event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send update_speaker event", error: String(error) },
      { status: 500 }
    );
  }
}