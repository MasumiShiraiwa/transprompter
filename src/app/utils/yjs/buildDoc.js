import * as Y from "yjs";
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function buildDoc() {
    const ydoc = new Y.Doc();

    const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
    const logContent = await fs.readFile(logPath, 'utf8');

    const lines = logContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
        for (const line of lines) {
            if (!line.trim()) continue;
            const json = JSON.parse(line);
            const update = json.update;
            const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
            const updateUint8 = new Uint8Array(updateArray);
            Y.applyUpdate(ydoc, updateUint8);
        }
    } else { // 初期化時の場合（ログがない場合）
        console.log("No log content found, initializing with default values");
        const yMap = ydoc.getMap();
        // Script Arrayの初期化
        const yScriptArray = ydoc.getArray('script'); // Group単位で管理する。
        const ySpeakerArray = ydoc.getArray('speaker');
        const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.json');
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        const num_groups = data.reduce((max, item) => Math.max(max, item.group), 0);
        let lines = Array.from({ length: num_groups + 1 }, () => []);
        for (let i = 0; i < data.length; i++) {
            lines[data[i].group].push({id: uuidv4(), text: data[i].text});
            // lines[data[i].group].push(data[i].text);
            ySpeakerArray.insert(i, [data[i].speaker]);
        }
        for (let i = 0; i < lines.length; i++) {
            yScriptArray.insert(i, [[...lines[i]]]);
        }

        // 初期状態をログに保存
        const stateUpdate = Y.encodeStateAsUpdate(ydoc);
        const updateArray = Array.from(stateUpdate);

        try {
            const sequence = lines.length;
            const logEntry = JSON.stringify({
                sequence: sequence,
                update: updateArray
            }) + "\n";
            await fs.appendFile(logPath, logEntry);
            console.log("Initialized yjs.log with default values");
        } catch (e) {
            console.error("Failed to write initial state to yjs.log", e);
        }
    }


    return ydoc;
}