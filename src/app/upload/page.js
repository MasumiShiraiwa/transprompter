// Zilliz Cloudにデータを登録する

import fs from 'fs';
import path from 'path';
import Upload from './components/upload';

export default function Page() {
    let text = '';
    try {
        const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
        text = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        console.warn('script_sample.txt not found:', e.message);
    }

    return (
        <div>
            <Upload script={text} />
        </div>
    )
}