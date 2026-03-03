import Parents from './components/parents';
import fs from 'fs';
import path from 'path';

export default function Page() {
    let lines = [];
    try {
        const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
        const text = fs.readFileSync(filePath, 'utf8');
        lines = text.toString().split('\n');
    } catch (e) {
        console.warn('script_sample.txt not found:', e.message);
    }

    return (
        <div>
            <Parents script={lines} />
        </div>
    )
}