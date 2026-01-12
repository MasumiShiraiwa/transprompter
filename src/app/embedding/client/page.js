'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'

export default function EmbdTest() {
    const [result, setResult] = useState(null);
    const [ready, setReady] = useState(null);

    const workerRef = useRef(null);

    useEffect(() => {
        if(!workerRef.current){
            workerRef.current = new Worker(new URL('@/app/utils/embedding_worker.js', import.meta.url), {
                type: 'module',
            });
        }

        // ワーカーからのメッセージを受け取るコールバック関数を定義/ハンドラーを設定
        const onMessageReceived = (event) => {
            console.log("onMessageReceived", event.data.status);
            // event.data.statusで成功かエラーかを判断
            switch (event.data.status) {
                case 'initiate':
                  setReady(false); // 初期化中
                  break;
                case 'ready':
                  setReady(true); // 準備完了
                  break;
                case 'success':
                  console.log("event", event);
                  setResult(event.data.data[0]) // 結果を設定
                  break;
                case 'error':
                  setResult(event.data.error) // エラーを設定
                  console.error(event.data.error);
                  break;
            }
        };
        workerRef.current.addEventListener('message', onMessageReceived);

        // コンポーネントがアンマウントされたときに実行されるクリーンアップ関数を定義
        return () => {
            workerRef.current.removeEventListener('message', onMessageReceived);
        };
    });

    // テキストリストをワーカーに送信する
    const handleSubmit = useCallback((text_list) => {
        console.log("handleSubmit", text_list);
        if(workerRef.current){
            workerRef.current.postMessage({
                type: 'embedding',
                text_list: text_list,
            });
        }
    }, []);

    return (
        <div>
            <h1>Embedding Test</h1>
            <input
                className='border-2 border-gray-300 rounded-md p-2'
                type="text"
                onChange={e => handleSubmit([e.target.value])}
                placeholder="ここにテキストを入力してください"
            />
            {ready !== null && (
                <pre className="bg-gray-100 p-2 rounded">
                { (!ready || !result) ? 'Loading...' : JSON.stringify(result, null, 2) }
                </pre>
            )}
        </div>
    )
}