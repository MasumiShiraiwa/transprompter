// 位置更新イベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { position } = await req.json();
  console.log("received position_update event:", position);
  try {
    await pusherServer.trigger("private-position-update", "evt::position-update", {
      position: position,
    });
    console.log("position_update event sent");

    return Response.json({ message: "position_update event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send position_update event", error: String(error) },
      { status: 500 }
    );
  }
}