import Parents from './components/parents';
import fs from 'fs';
import path from 'path';

export default function Page() {
    // プロジェクトルートからの相対パスを使用
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
    var text = fs.readFileSync(filePath, 'utf8');
    var lines = text.toString().split('\n'); // 円マークではなく通常のバックスラッシュ
    console.log(lines);

    return (
        <div>
            <Parents script={lines} />
        </div>
    )
}