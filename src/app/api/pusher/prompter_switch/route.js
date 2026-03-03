// プロンプターモード切り替えイベントを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { mode, project_id } = await req.json();
  console.log("received prompter_switch event:", mode);
  try {
    await pusherServer.trigger(`private-prompter-switch-${project_id}`, `evt::prompter-switch-${project_id}`, {
      mode: mode,
    });
    console.log("prompter_switch event sent");

    return Response.json({ message: "prompter_switch event sent" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Failed to send prompter_switch event", error: String(error) },
      { status: 500 }
    );
  }
}