// 利用しない。
// サーバで単一のDocしかもてない。

// import { Doc, applyUpdate } from 'yjs';
// import fs from 'fs';
// import path from 'path';

// // サーバーサイドでシングルトンとしてY.Docインスタンスを保持する
// // 注意: Next.jsのサーバーレス環境では、リクエスト間でインスタンスが永続化される保証はありません。
// // 必要に応じてRedisやデータベース等の永続化層と連携してください。

// const globalForYjs = global;

// if (!globalForYjs.ydoc) {
//     const doc = new Doc();
//     const yMap = doc.getMap();
//     yMap.set("prompter_mode", false)
//     yMap.set("cue_card_mode", false)

//     // --- yjs.logから更新履歴を適用 ---
//     try {
//         const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
//         if (fs.existsSync(logPath)) {
//             const content = fs.readFileSync(logPath, 'utf8');
//             const lines = content.split('\n');
//             let count = 0;
//             for (const line of lines) {
//                 if (!line.trim()) continue;
//                 try {
//                     const json = JSON.parse(line);
//                     if (json.update) {
//                         const updateArray = json.update instanceof Object && !Array.isArray(json.update) ? Object.values(json.update) : json.update;
//                         const updateUint8 = new Uint8Array(updateArray);
//                         console.log("updateUint8", updateUint8);
//                         applyUpdate(doc, updateUint8);
//                         count++;
//                     }
//                 } catch (e) {
//                     console.error("Error parsing log line:", e);
//                 }
//             }
//             console.log(`Restored ${count} updates from yjs.log`);
//         }
//     } catch (e) {
//         console.error("Failed to restore from yjs.log:", e);
//     }

//     console.log("prompter mode", doc.getMap().get('prompter_mode'));
//     console.log("cue card mode", doc.getMap().get('cue_card_mode'));

//     // --- 初期化データの投入 ---
//     // 実運用時は、DBからUpdate履歴を取得して投入する
//     // コード上で定義された初期データ
//     // const initialScript = [["Hello", "Goodbye"], ["Hello"]];
//     // const initialSpeaker = ["A", "A", "B"];
//     const initialCueCardMode = true;
//     const initialPrompterMode = false;

//     // データが存在しない場合のみ投入する（サーバー再起動時の再初期化防止のため、中身をチェック）
    
//     // // script
//     // const yScriptArray = doc.getArray('script');
//     // if (yScriptArray.length === 0) {
//     //     yScriptArray.insert(0, initialScript);
//     // }

//     // // speaker
//     // const ySpeakerArray = doc.getArray('speaker');
//     // if (ySpeakerArray.length === 0) {
//     //     ySpeakerArray.insert(0, initialSpeaker);
//     // }

//     // // mode (Map)
//     // const yModeMap = doc.getMap(); 
//     // if (!yModeMap.has('cue_card_mode')) {
//     //     yModeMap.set('cue_card_mode', initialCueCardMode);
//     // }
//     // if (!yModeMap.has('prompter_mode')) {
//     //     yModeMap.set('prompter_mode', initialPrompterMode);
//     // }

//     globalForYjs.ydoc = doc;
// }

// export const ydoc = globalForYjs.ydoc;
