// カンペの変更内容を更新するAPI

import { updateCueCard } from '@/app/utils/cue_card';

export async function POST(req) {
    const body = await req.json();
    const scripts = body.scripts;
    const speaker_list = body.speaker_list;
    try{
        const text = updateCueCard(scripts, speaker_list);
        return Response.json({ message: "Cue card updated successfully. text: " + text }, { status: 200 });
    }catch(error){
        console.error(error);
        return Response.json({ message: "Failed to update cue card", error: String(error) }, { status: 500 });
    }
}