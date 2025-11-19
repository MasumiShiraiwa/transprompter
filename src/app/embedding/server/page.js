'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'
import Similar from './components/similar'

export default function EmbdTest() {
    const [text, setText] = useState("");
    const [ready, setReady] = useState(null);
    const [result, setResult] = useState(null);

    // api POST requestで、textを送信し、結果を取得する
    const handleSubmit = useCallback(async () => {
        setReady(false);
        const res = await fetch('/api/emb_server', {
            method: 'POST',
            body: JSON.stringify({ text_list: [text] }),
        });
        const data = await res.json();
        console.log("data", data.data[0][0].length);
        setReady(true);
        setResult(data.data[0][0]);
    }, [text]);


    return (
        <div>
            <h1>Embedding Test</h1>
            <input
                className='border-2 border-gray-300 rounded-md p-2'
                type="text"
                onChange={e => setText(e.target.value)}
                placeholder="ここにテキストを入力してください"
            />
            <button onClick={handleSubmit}>送信</button>
            {ready !== null && (
                <div>
                    <pre className="bg-gray-100 p-2 rounded">
                    { (!ready || !result) ? 'Loading...' : JSON.stringify(result.slice(0,5), null, 2) + "..." + JSON.stringify(result.slice(-5), null, 2) }
                    </pre>
                    <Similar embed_data={result} />
                </div>
            )}
        </div>
    )
}