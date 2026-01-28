// 定型カンペ送信イベントを送信するAPI
import fs from 'fs';
import path from 'path';

import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {
  const { id } = await req.json();
  console.log("received template event:", id);
  try{
        const filePath = path.join(process.cwd(), 'src', 'scripts', 'template_list.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const data_list = JSON.parse(data);
        const template = data_list.find(item => item.id === id);
        console.log("template:", template);
        await pusherServer.trigger("private-cue-card-template", "evt::cue-card-template", {
            content: template.content,
        });
        return Response.json({ message: "Template sent successfully" }, { status: 200 });
    }catch(error){
        console.error(error);
        return Response.json({ message: "Failed to send template", error: String(error) }, { status: 500 });
    }

}