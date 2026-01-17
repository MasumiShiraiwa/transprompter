// 台本更新イベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { script, speaker_list } = await req.json();
  console.log("received update_script event:", script);
  try {
    await pusherServer.trigger("private-update-script", "evt::update-script", {
      script: script,
      speaker_list: speaker_list,
    });
    console.log("update_script event sent");

    return Response.json({ message: "update_script event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send update_script event", error: String(error) },
      { status: 500 }
    );
  }
}