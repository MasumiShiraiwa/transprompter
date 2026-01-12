// 行挿入イベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { index, text } = await req.json();
  console.log("received inserting line event:", index, text);
  try {
    await pusherServer.trigger("private-inserting", "evt::inserting", {
      index: index,
      text: text,
    });

    return Response.json({ message: "Inserting line event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send inserting line event", error: String(error) },
      { status: 500 }
    );
  }
}