// Yjsの更新を受け取り、ログファイルに保存/ 全クライアントにブロードキャストするAPI

import { NextResponse } from 'next/server';
// import { applyUpdate } from 'yjs';
// import { ydoc } from '@/app/yjs/server'; // サーバーサイドでシングルトンとしてY.Docインスタンスを保持する
import { getPusherInstance } from '@/app/utils/pusher/server';
import fs from 'fs/promises';
import path from 'path';

const logUpdate = async (update) => {
    try {
        const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
        const logContent = await fs.readFile(logPath, 'utf8');
        const lines = logContent.split('\n');
        const sequence = lines.length-1;
        const updateArray = update instanceof Uint8Array ? Array.from(update) : update;
        const logEntry = JSON.stringify({
            sequence: sequence,
            update: updateArray
        }) + "\n";
        await fs.appendFile(logPath, logEntry);
    } catch (e) {
        console.error("Failed to write to yjs.log", e);
    }
}

export async function POST(request) {
    const body = await request.json();
    const update = body.update;

    try{
        // クライアントから送られてきたデータがオブジェクト形式（{'0': 1, '1': 2...}）の場合に対応
        const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
        const updateUint8 = new Uint8Array(updateArray);
        
        // 更新を適用
        // applyUpdate(ydoc, updateUint8); // サーバーサイドではydocを利用しない。
        await logUpdate(updateUint8);

        // Pusherを使って更新を送信する。
        const pusherServer = getPusherInstance();
        await pusherServer.trigger("private-yjs-update", "evt::yjs-update", {
            update: update,
        });
        return NextResponse.json({ message: "Update applied" }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}