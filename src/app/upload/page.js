// Zilliz Cloudにデータを登録する

import fs from 'fs';
import path from 'path';
import Upload from './components/upload';

export default function Page() {
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.toString().split('\n');
    console.log("lines", lines.length);


    return (
        <div>
            <Upload script={lines} />
        </div>
    )


}