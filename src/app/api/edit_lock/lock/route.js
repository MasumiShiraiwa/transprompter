// Upstash Redisを使用して、編集ロックを取得するAPI


import { NextResponse } from 'next/server';
import { lockScript, lockScriptPipeline, lockScriptMulti } from '@/app/utils/upstash/client';
import { getPusherInstance } from "@/app/utils/pusher/server";
const pusherServer = getPusherInstance();

export const dynamic = 'force-dynamic'; // defaults to auto

export async function POST(req) {

    try{
        const { scriptIds, userId, project_id } = await req.json();
        console.log("scriptIds: ", scriptIds, typeof scriptIds);
        if(scriptIds === null || userId === null){
            console.error(`Lock script failed: scriptId: ${scriptIds}, userId: ${userId}`);
            return NextResponse.json({ message: "Lock script failed", error: `scriptId: ${scriptIds}, userId: ${userId}` }, { status: 400 });
        }
        // const result = await lockScript(scriptIds, userId);
        // const result = await lockScriptPipeline(scriptIds, userId)
        const result = await lockScriptMulti(scriptIds, userId)

        if(result){
            void pusherServer.trigger(`private-upstash-lock-${project_id}`, `evt::lock-${project_id}`, {
                scriptIds: scriptIds,
                userId: userId,
            });
            console.log("lock event sent");
        }

        return NextResponse.json({ message: "Lock script completed successfully", result: result }, { status: 200 });
    } catch (error) {
        console.error('Lock script error:', error);
        return NextResponse.json({ message: "Lock script failed", error: error.message }, { status: 500 });
    }
}
