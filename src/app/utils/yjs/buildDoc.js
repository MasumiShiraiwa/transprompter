import * as Y from "yjs";
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@/app/utils/supabase/server';

function stringToUint8Array(str) {
    const hex = typeof str === 'string' && str.startsWith('\\x') ? str.slice(2) : str;
    const json_uint8array = JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'));
    return new Uint8Array(Object.values(json_uint8array));
}

export async function buildDoc(project_id = null) {
    const ydoc = new Y.Doc();

    // const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
    // const logContent = await fs.readFile(logPath, 'utf8');

    const supabase = await createClient();
    let { data: logData, error: logError } = await supabase
        .from('log')
        .select('sequence, update')
        .eq('project_id', project_id)
        .order('sequence', { ascending: true });
    if (logError) {
        console.error("Failed to get log data", logError);
        return;
    }

    // console.log("logData", logData, logData.length);

    // const lines = logContent.split('\n').filter(line => line.trim() !== '');

    if (logData.length > 0) {
        // for (const line of lines) {
        //     if (!line.trim()) continue;
        //     const json = JSON.parse(line);
        //     const update = json.update;
        //     console.log("update", update);
        //     const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;

        //     const updateUint8 = new Uint8Array(updateArray);
        //     console.log("apply update", updateUint8);
        //     // Y.applyUpdate(ydoc, updateUint8);
        // }
        logData.forEach(item => {
            let update = item.update;
            // console.log("update", stringToUint8Array(update));
            const updateUint8 = stringToUint8Array(update);
            Y.applyUpdate(ydoc, updateUint8);
        });
    }else{
        console.log("No log content found, initializing with default values");
        const yScriptArray = ydoc.getArray('script'); // Group単位で管理する。
        const ySpeakerMap = ydoc.getMap('speaker_map');

        const supabase = await createClient();
        const { data: scriptData, error } = await supabase
            .from('Script')
            .select('id, text, group, performer_id, sequence')
            .eq('project_id', project_id);
        if (error) {
            console.error("Failed to get script data", error);
            return;
        }

        let performerList = {};
        await supabase
            .from('Performer')
            .select('id, name')
            .eq('project_id', project_id).then(res => {
                res.data.forEach(item => {
                    performerList[item.id] = item.name;
                });
            });
        if (scriptData.length === 0 || performerList.length === 0) {
            console.error("Failed to get performer list");
            return ydoc;
        }
        const data = scriptData ?? [];

        const num_groups = data.reduce((max, item) => Math.max(max, item.group), 0);
        // console.log("num_groups", num_groups);
        let lines = Array.from({ length: num_groups + 1 }, () => []);

        for (let i = 0; i < data.length; i++) {
            lines[data[i].group].push({ id: data[i].id, text: data[i].text });
            ySpeakerMap.set(data[i].id, performerList[data[i].performer_id]);
        }

        lines.map((line)=>{console.log("line", line)});
        for (let i = 0; i < lines.length; i++) {
            yScriptArray.insert(i, [[...lines[i]]]);
        }

        // 初期状態をログに保存
        const stateUpdate = Y.encodeStateAsUpdate(ydoc);
        const updateArray = Array.from(stateUpdate);
        await supabase.from('log').insert({
            sequence: 0,
            update: new Uint8Array(updateArray),
            project_id: project_id
        })
        console.log("Initialized yjs.log with default values");

    }
    //  else { // 初期化時の場合（ログがない場合）
    //     console.log("No log content found, initializing with default values");
    //     const yMap = ydoc.getMap();
    //     // Script Arrayの初期化
    //     const yScriptArray = ydoc.getArray('script'); // Group単位で管理する。
    //     const ySpeakerMap = ydoc.getMap('speaker_map');
    //     const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.json');
    //     const fileContent = await fs.readFile(filePath, 'utf8');
    //     const data = JSON.parse(fileContent);
    //     const num_groups = data.reduce((max, item) => Math.max(max, item.group), 0);
    //     let lines = Array.from({ length: num_groups + 1 }, () => []);
    //     for (let i = 0; i < data.length; i++) {
    //         lines[data[i].group].push({id: data[i].id, text: data[i].text});
    //         // lines[data[i].group].push(data[i].text);
    //         // ySpeakerArray.insert(i, [data[i].speaker]);
    //         ySpeakerMap.set(data[i].id, data[i].speaker);
    //     }
    //     for (let i = 0; i < lines.length; i++) {
    //         yScriptArray.insert(i, [[...lines[i]]]);
    //     }

    //     // 初期状態をログに保存
    //     const stateUpdate = Y.encodeStateAsUpdate(ydoc);
    //     const updateArray = Array.from(stateUpdate);

    //     try {
    //         const logEntry = JSON.stringify({
    //             sequence: 0,
    //             update: updateArray
    //         }) + "\n";
    //         await fs.writeFile(logPath, logEntry);
    //         console.log("Initialized yjs.log with default values");
    //     } catch (e) {
    //         console.error("Failed to write initial state to yjs.log", e);
    //     }
    // }

    return ydoc;
}

export async function buildSnapshotDoc(data, project_id) {
    const ydoc = new Y.Doc();
    const supabase = await createClient();
    console.log("project_id", project_id);


    const logPath = path.join(process.cwd(), 'src', 'scripts', 'yjs.log');
    const yScriptArray = ydoc.getArray('script'); // Group単位で管理する。
    const ySpeakerMap = ydoc.getMap('speaker_map');

    for (let i = 0; i < data.length; i++) {
        for(let j = 0; j < data[i].length; j++) {
            ySpeakerMap.set(data[i][j].id, data[i][j].speaker);
        }
        yScriptArray.insert(i, [[...data[i]]]);
    }
    const stateUpdate = Y.encodeStateAsUpdate(ydoc);
    const updateArray = Array.from(stateUpdate);
    try {
        // const sequence = data.length;
        // const logEntry = JSON.stringify({
        //     sequence: sequence,
        //     update: updateArray
        // }) + "\n";
        // await fs.writeFile(logPath, logEntry);
        const { error: deleteError } = await supabase.from('log').delete().eq('project_id', project_id);
        if (deleteError) {
            console.error("Failed to delete log data", deleteError);
            return;
        }

        // console.log("updateArray", new Uint8Array(updateArray));

        await supabase.from('log').insert({
            sequence: 0,
            update: new Uint8Array(updateArray),
            project_id: project_id
        })
        console.log("Snapshot yjs.log with data length: ", data.length);
    } catch (e) {
        console.error("Failed to write snapshot state to yjs.log", e);
    }

}