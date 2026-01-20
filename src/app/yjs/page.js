"use client"

import YjsClient from "@/app/yjs/client";

export default function YjsSample() {
    // const ydocA = new Y.Doc();
    // const ytextA = ydocA.getText('test'); // nameは、Y.Textのインスタンスを取得するためのキー
    // const ytextA2 = ydocA.getText('test2'); // 異なるnameを設定すると、異なるY.Textのインスタンスを取得する。
    // ytextA.insert(0, 'Hello, world! from A');
    // ytextA2.insert(0, 'A2A2');

    // const ydocB = new Y.Doc();
    // const ytextB = ydocB.getText('test');
    // ytextB.insert(0, 'Hello, world! from B');
    // const update = Y.encodeStateAsUpdate(ydocB); // doc全体

    // const ydocC = new Y.Doc();
    // const ymapC = ydocC.getMap();
    // ymapC.set('test', 'Hello, world! from C');
    // console.log("ymapC", ymapC.get());

    return (
        <div>
            <h1>Yjs Sample</h1>
            <YjsClient />
        </div>
    )
}