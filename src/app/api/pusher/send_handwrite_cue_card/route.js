// 手書きカンペを送信するAPI

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export async function POST(req) {
    const { cueCard, project_id } = await req.json();
    console.log("received handwrite cue card data size:", cueCard.length, "bytes");
    try{
        await pusherServer.trigger(`private-handwrite-cue-card-${project_id}`, `evt::handwrite-cue-card-${project_id}`, {
            cueCard: cueCard,
        });

        return Response.json({ message: "Handwritten cue card sent successfully" }, { status: 200 });
    }catch(error){
        console.error(error);
        return Response.json({ message: "Failed to send handwritten cue card", error: String(error) }, { status: 500 });
    }
}