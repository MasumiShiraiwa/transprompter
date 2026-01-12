import Layout from './components/layout';
import fs from 'fs';
import path from 'path';

export default function Editor() {
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
    const text = fs.readFileSync(filePath, 'utf8'); // 改行コードを含むテキスト(一つの文字列)
    // const no_newline_script = text.replace(/\r?\n/g, ''); // 改行コードを削除
    // const lines = no_newline_script.split('。').filter(s => s !== ''); // 句点で分割し、空文字列を削除 {0: "...", 1: "...", ...}
    const lines = text.split(/\r\n|\n|\r/).filter(s => s !== '');


    console.log("lines", lines.length);

    return (
        <div>
            <Layout scripts={lines} />
        </div>
    )
}