// Yjsの更新を受け取り、ログファイルに保存/ 全クライアントにブロードキャストするAPI

import { NextResponse } from 'next/server';
// import { applyUpdate } from 'yjs';
// import { ydoc } from '@/app/yjs/server'; // サーバーサイドでシングルトンとしてY.Docインスタンスを保持する
import { getPusherInstance } from '@/app/utils/pusher/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@/app/utils/supabase/server';

const logUpdate = async (update, project_id) => {
    try {
        // const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
        // const logContent = await fs.readFile(logPath, 'utf8');
        // const lines = logContent.split('\n');
        // const sequence = lines.length-1;
        // const updateArray = update instanceof Uint8Array ? Array.from(update) : update;
        // const logEntry = JSON.stringify({
        //     sequence: sequence,
        //     update: updateArray
        // }) + "\n";
        // await fs.appendFile(logPath, logEntry);
        const supabase = await createClient();
        // Supabaseのlogテーブルから、指定されたproject_idに紐づく最新のsequence番号を取得
        const { data: latestLog } = await supabase
            .from('log')
            .select('sequence')
            .eq('project_id', project_id)
            .order('sequence', { ascending: false })
            .limit(1);

        const sequence = latestLog && latestLog.length > 0 ? latestLog[0].sequence + 1 : 0;
        console.log("sequence", sequence);
        await supabase.from('log').insert({
            sequence: sequence,
            update: update,
            project_id: project_id
        });
    } catch (e) {
        console.error("Failed to write to yjs.log", e);
    }
}

export async function POST(request) {
    console.log("project_id in API/yjs/update");
    const {update, project_id} = await request.json();

    try{
        // クライアントから送られてきたデータがオブジェクト形式（{'0': 1, '1': 2...}）の場合に対応
        const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
        
        // 更新を適用
        // applyUpdate(ydoc, updateUint8); // サーバーサイドではydocを利用しない。
        await logUpdate(new Uint8Array(updateArray), project_id);

        // Pusherを使って更新を送信する。
        const pusherServer = getPusherInstance();
        await pusherServer.trigger(`private-yjs-update-${project_id}`, `evt::yjs-update-${project_id}`, {
            update: update,
        });
        return NextResponse.json({ message: "Update applied" }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}