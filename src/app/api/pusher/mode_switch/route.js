// モード切り替えイベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { mode } = await req.json();
  console.log("received mode_switch event:", mode);
  try {
    await pusherServer.trigger("private-mode-switch", "evt::mode-switch", {
      mode: mode,
    });
    console.log("mode_switch event sent");

    return Response.json({ message: "mode_switch event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send mode_switch event", error: String(error) },
      { status: 500 }
    );
  }
}