import fs from 'fs';
import path from 'path';

export const updateCueCard = (scripts) => {
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
    const processedScripts = scripts.map(script => script.replace(/\n/g, "|"));
    const text = processedScripts.join("\n");
    fs.writeFileSync(filePath, text);
    console.log("Cue card updated successfully. text: " + text);
    return text;
}