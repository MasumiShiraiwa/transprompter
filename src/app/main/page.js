import Layout from './components/layout';
import fs from 'fs';
import path from 'path';

export default function Main() {
    const filePath = path.join(process.cwd(), 'src', 'scripts', 'script_sample.txt');
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.toString().split('\n');
    console.log("lines", lines.length);

    return (
        <div>
            <Layout scripts={lines} />
        </div>
    )
}

