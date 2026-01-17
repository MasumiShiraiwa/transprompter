import Layout from './components/layout';
import fs from 'fs';
import path from 'path';

export default function Presenter() {
    // const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
    // const text = fs.readFileSync(filePath, 'utf8'); // 改行コードを含むテキスト(一つの文字列)
    // const no_newline_script = text.replace(/\r?\n/g, ''); // 改行コードを削除
    // const lines = no_newline_script.split('。').filter(s => s !== ''); // 句点で分割し、空文字列を削除 {0: "...", 1: "...", ...}
    // const lines = text.split(/\r\n|\n|\r/).filter(s => s !== '');


    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const num_groups = data.reduce((max, item) => Math.max(max, item.group), 0);
    let lines = Array.from({ length: num_groups + 1 }, () => []);
    for (let item of data) {
        lines[item.group].push(item.text);
    }

    const speakers = data.map(item => item.speaker);

    const performers_filePath = path.join(process.cwd(), 'src', 'scripts', 'performers.json');
    const performers_fileContent = fs.readFileSync(performers_filePath, 'utf8');
    const performers = JSON.parse(performers_fileContent);
    const performers_list = performers.map(item => item.name);

    return (
        <div>
            <Layout scripts={[]} speakers={[]} performers_list={performers_list} />
        </div>
    )
}