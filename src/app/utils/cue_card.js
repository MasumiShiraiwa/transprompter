import fs from 'fs';
import path from 'path';

// speaker_list は API 経由では plain object、クライアントでは Map のため両方に対応
const getSpeaker = (list, id) =>
    list instanceof Map ? list.get(id) : list?.[id];

export const updateCueCard = (scripts, speaker_list) => {
    console.log("speaker_list: ", typeof speaker_list);
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.json');
    // scriptsとspeaker_listの長さが一致することを前提とするか、あるいはindexで結合する
    let globalIndex = 0;
    let data = [];
    scripts.forEach((script, index) => {
        script.forEach(line => {
            data.push({
                id: line.id,
                group: index,
                speaker: getSpeaker(speaker_list, line.id) || "Unknown", // 対応するスピーカーがいない場合のフォールバック
                text: line.text.replace(/\n/g, "|")
            });
            globalIndex += 1;
        });
    });

    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent);
    console.log("Cue card updated successfully to JSON.");
    return jsonContent;
}