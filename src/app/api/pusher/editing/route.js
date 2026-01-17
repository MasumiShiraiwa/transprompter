// 編集イベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { globalIdx, groupIdx, localIdx, text, speaker } = await req.json();
  console.log("received editing event:", globalIdx, groupIdx, localIdx, text, speaker);
  try {
    await pusherServer.trigger("private-editing", "evt::editing", {
      globalIdx: globalIdx,
      groupIdx: groupIdx,
      localIdx: localIdx,
      text: text,
      speaker: speaker,
    });

    return Response.json({ message: "Editing event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send editing event", error: String(error) },
      { status: 500 }
    );
  }
}