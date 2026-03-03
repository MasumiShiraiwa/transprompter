// Upstash Redisを使用して、編集アンロックを取得するAPI


import { NextResponse } from 'next/server';
import { unlockScript, unlockScriptMulti } from '@/app/utils/upstash/client';
import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {

    try{
        const { scriptIds, userId, project_id } = await req.json();
        if(scriptIds === null || userId === null){
            return NextResponse.json({ message: "Unlock script failed", error: 'scriptId or userId is required' }, { status: 400 });
        }
        // const result = await unlockScript(scriptIds, userId);
        const result = await unlockScriptMulti(scriptIds, userId);

        if(result){
            void pusherServer.trigger(`private-upstash-unlock-${project_id}`, `evt::unlock-${project_id}`, {
                scriptIds: scriptIds,
                userId: userId,
              });
              console.log("unlock event sent");
        }
        return NextResponse.json({ message: "Unlock script completed successfully", result: result }, { status: 200 });
    } catch (error) {
        console.error('Unlock script error:', error);
        return NextResponse.json({ message: "Unlock script failed", error: error.message }, { status: 500 });
    }
}
