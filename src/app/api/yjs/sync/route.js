// Yjsの同期を行うAPI
// YJSのupdate配列データを送信するAPI   

import { NextResponse } from 'next/server';
import { encodeStateAsUpdate } from 'yjs';
import { buildDoc } from '@/app/utils/yjs/buildDoc';
// import { ydoc } from '@/app/yjs/server'; // サーバーサイドでシングルトンとしてY.Docインスタンスを保持する

export async function GET() {
    try {
        // 現在のサーバー上のydocの状態をバイナリとして取得
        // これにより、他のクライアントが加えた変更も含めて全状態が同期される
        const ydoc = await buildDoc(); // SnapshotからYJS documentを再構築する。
        const stateUpdate = encodeStateAsUpdate(ydoc); // 更新済みのYJS documentからupdateを再構築する。
        const updateArray = Array.from(stateUpdate);

        console.log("sync update size:", updateArray.length);

        // 送信
        return NextResponse.json({ update: updateArray }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Sync failed", error: error.message }, { status: 500 });
    }
}