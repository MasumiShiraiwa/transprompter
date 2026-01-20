import Layout from './components/layout';
import fs from 'fs';
import path from 'path';

export default function Editor() {
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const num_groups = data.reduce((max, item) => Math.max(max, item.group), 0);
    let lines = Array.from({ length: num_groups + 1 }, () => []);
    for (let item of data) {
        lines[item.group].push(item.text);
    }
    const speakers = data.map(item => item.speaker);

    // 出演者リストを取得
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