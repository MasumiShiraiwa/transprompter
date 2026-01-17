import fs from 'fs';
import path from 'path';

export const updateCueCard = (scripts, speaker_list) => {
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.json');
    // scriptsとspeaker_listの長さが一致することを前提とするか、あるいはindexで結合する
    let globalIndex = 0;
    let data = [];
    scripts.forEach((script, index) => {
        script.forEach(line => {
            data.push({
                group: index,
                speaker: speaker_list[globalIndex] || "Unknown", // 対応するスピーカーがいない場合のフォールバック
                text: line.replace(/\n/g, "|")
            });
            globalIndex += 1;
        });
    });

    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent);
    console.log("Cue card updated successfully to JSON.");
    return jsonContent;
}