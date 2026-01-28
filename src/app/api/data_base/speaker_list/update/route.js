// 出演者リストを更新するAPI

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const performers_filePath = path.join(process.cwd(), 'src', 'scripts', 'performers.json');

export async function POST(req) {
    const body = await req.json();
    const speaker_list = body.speaker_list;
    let object = [];
    for(let i = 0; i < speaker_list.length; i++){
        object.push({name: speaker_list[i]});
    }

    try{
        const res = fs.writeFileSync(performers_filePath, JSON.stringify(object, null, 2));
        return NextResponse.json({ message: "Speaker list updated successfully" }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Failed to update speaker list", error: String(error) }, { status: 500 });
    }
}