// Yjsの同期を行うAPI   
// 既存のupdateを削除して、統合し、新たなupdateを送信するAPI

import { NextResponse } from 'next/server';
import * as Y from 'yjs';
import { buildDoc } from '@/app/utils/yjs/buildDoc';
// import { ydoc } from '@/app/yjs/server'; // サーバーサイドでシングルトンとしてY.Docインスタンスを保持する
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
    
    const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
    const logContent = await fs.readFile(logPath, 'utf8');
    
    // const lines = logContent.split('\n').filter(line => line.trim() !== '');
    // // for (const line of lines) {
    // //     if (!line.trim()) continue;
    // //     const json = JSON.parse(line);
    // //     const update = json.update;
    // //     const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
    // //     const updateUint8 = new Uint8Array(updateArray);
    // //     Y.applyUpdate(ydoc, updateUint8);
        
    // // }
    const ydoc = await buildDoc();
    const diffupdate = Y.encodeStateAsUpdate(ydoc);
    const diffupdateArray = Array.from(diffupdate);
    const diffupdateUint8 = new Uint8Array(diffupdateArray);
    const diffupdateObject = {
        sequence: 0,
        update: diffupdateUint8
    };
    console.log("diffupdateObject", diffupdateObject);
    await fs.writeFile(logPath, "", { flag: 'w' });
    const diffupdateJson = JSON.stringify(diffupdateObject) + "\n";
    await fs.appendFile(logPath, diffupdateJson);
    return NextResponse.json({ message: "Snapshot received", }, { status: 200 });
}