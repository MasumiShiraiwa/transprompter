// ここは権限があるユーザーのみが利用できるパネル。
// AI書き換えボタンを押すと、すべての編集ロック権限を奪うようにする。

"use client"

import { useState, useEffect } from 'react';

export default function AutoRewrite({ script, setNewScript, current_position }) {
    const [remainTime, setRemainTime] = useState(0); // [s]
    const [startPosition, setStartPosition] = useState(null);
    const [originalScript, setOriginalScript] = useState([]);
    const [isUsingOriginalScript, setIsUsingOriginalScript] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [isExpanding, setIsExpanding] = useState(false);

    const id2Index = (id) => {
        if (id == null || !script || typeof script !== 'object') return null;
        for (const [idx, line] of Object.entries(script)) {
            if (line?.id === id) return Number(idx);
        }
        return null;
    };

    useEffect(() => {
        const idx = id2Index(current_position);
        if (idx !== null) setStartPosition(idx);
    }, []);

    const keys = script && typeof script === 'object' ? Object.keys(script).map(Number) : [];
    const maxIndex = keys.length > 0 ? Math.max(0, ...keys) : 0; // 0から始まるindexを返す
    const safeStart = startPosition ?? 0;

    const handleStartPosDecrement = () => setStartPosition(prev => Math.max(1, (prev ?? 0) - 1));
    const handleStartPosIncrement = () => setStartPosition(prev => Math.min(maxIndex + 1, (prev ?? 0) + 1));
    const handleStartPosInput = (e) => {
        const v = e.target.value;
        if (v === '') { setStartPosition(null); return; }
        const n = parseInt(v, 10);
        if (!Number.isNaN(n)) setStartPosition(Math.max(1, Math.min(maxIndex + 1, n)));
    };
    const handleStartPosBlur = () => { if (startPosition === null) setStartPosition(1); };

    const handleRemainTimeDecrement = (delta) => setRemainTime(prev => Math.max(0, prev - delta));
    const handleRemainTimeIncrement = (delta) => setRemainTime(prev => prev + delta);
    const handleRemainTimeInput = (e) => {
        const v = e.target.value;
        if (v === '') { setRemainTime(0); return; }
        const n = parseInt(v, 10);
        if (!Number.isNaN(n) && n >= 0) setRemainTime(n);
    };

    const handlePromptInput = (e) => {
        setPrompt(e.target.value);
    }


    const getOriginalScriptFromWordFile = async (formData) => { // input: formData(wordFile), output: original_script(Document)
        try{
            const res = await fetch('/api/word_file', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            const html_str = data.data.html;
            const html_dom = new DOMParser().parseFromString(html_str, 'text/html');
            const html_body = html_dom.body;
            const table = html_body.querySelector('table');
            return table;
        }catch(error){
            console.error(error);
            return null;
        }
    }

    const convertTableToScript = (table) => {
        let original_script_temp = [];
        let index = 0;
        if(typeof table !== 'object') {return null;}

        table.querySelectorAll('tr')
        .forEach(tr => {
            const tds = tr.querySelectorAll('td')
            if(tds.length > 2){
                original_script_temp.push({index: index, speaker: tds[tds.length-2].textContent, text: tds[tds.length-1].textContent});
            }else if(tds.length === 2){
                original_script_temp.push({index: index, speaker: tds[0].textContent, text: tds[1].textContent});
            }else{
                original_script_temp.push({index: index, speaker: "", text: tds[0].textContent});
            }
            index++;
        })
        return original_script_temp;
    }

    const processWordFile = async (file) => {
        if (!file || !file.name.endsWith('.docx')) {
            alert('.docx 形式のファイルを選択してください。');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        const table = await getOriginalScriptFromWordFile(formData);
        const original_script_temp = convertTableToScript(table);
        setOriginalScript(original_script_temp);
        setIsUsingOriginalScript(true);
    };

    const handleWordFileUpload = async (e) => {
        const wordFile = e.target.files?.[0];
        if (wordFile) await processWordFile(wordFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) await processWordFile(file);
    };


    // AI自動書き換えボタンを押したときの処理
    const handleAutoRewrite = async () => {
        try{
            const res_data = await fetch('/api/azure_openai/rewrite_script', {
                method: 'PUT',
                body: JSON.stringify({
                    data: {
                        previous_scripts: script,
                        start_position: isUsingOriginalScript ? 0 : startPosition - 1,
                        remain_time: isUsingOriginalScript ? 0 : remainTime,
                        original_script: isUsingOriginalScript ? originalScript : null,
                    },
                }),
            });

            
            let data = await res_data.json();
            data = JSON.parse(data.data); // {rewritten_script: Object{key: value(sentence_text)}}
            let temp_script = []
            for(let k in script){
                if(k < startPosition - 1){
                    temp_script.push("");
                }
                else if(k >= startPosition - 1 && k < startPosition + Object.keys(data.rewritten_script).length){
                    temp_script.push(data.rewritten_script[k]);
                }else{
                    temp_script.push(undefined);
                }
            }
            console.log("temp_script: ", temp_script, "length: ", temp_script.length);
            setNewScript(temp_script);
        }catch(error){
            console.error(error);
        }
    }

    // AI自動展開ボタンを押したときの処理
    const handleAutoExpand = async () => {
            setIsExpanding(true);
            try{
                const res_data = await fetch('/api/azure_openai/expand_script', {
                    method: 'PUT',
                    body: JSON.stringify({
                        data: {
                            previous_scripts: script,
                            original_script: isUsingOriginalScript ? originalScript : null,
                            prompt: prompt,
                        },
                    }),
                });
                
                let data = await res_data.json();
                data = JSON.parse(data.data); // {rewritten_script: Object{key: value(sentence_text)}}
                console.log("data.pattern: ", data.pattern);
                console.log("data: ", data, typeof data.expanded_cue_card);
                let temp_script = [...Object.entries(script).map(([index, v]) => v.text.replace(/\|/g, ""))]
                for(let k of Object.keys(data.expanded_cue_card)){
                    temp_script.push(data.expanded_cue_card[k]);
                }
                console.log("temp_script: ", temp_script, "length: ", temp_script.length);
                setNewScript(temp_script);
            }catch(error){
                console.error(error);
            }finally{
                setIsExpanding(false);
            }
        }

    return (
        <div>
            {/* <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-sm font-bold text-gray-700">書き換え位置</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Decrement"
                        onClick={handleStartPosDecrement}
                        disabled={safeStart <= 1}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <input
                        type="number"
                        min={0}
                        max={maxIndex + 1}
                        value={startPosition ?? ''}
                        onChange={handleStartPosInput}
                        onBlur={handleStartPosBlur}
                        aria-label="書き換え位置（数値入力）"
                        className="w-14 py-1 px-2 text-center font-medium text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                        type="button"
                        aria-label="Increment"
                        onClick={handleStartPosIncrement}
                        disabled={safeStart > maxIndex + 1 || maxIndex < 0}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div> */}


            {/* Wordファイルアップロード */}
            <div
                className={`mb-3 p-4 rounded-lg border-2 border-dashed transition-colors flex flex-wrap items-center gap-2 ${
                    isDragging
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input type='file' accept='.docx' id="wordFileUpload"
                onChange={handleWordFileUpload}
                onClick={(e) => e.target.value = null}
                className="hidden"
                />
                <button
                    type='button'
                    onClick={() => document.getElementById("wordFileUpload").click()}
                    className="py-1.5 px-3 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-medium text-gray-700 transition-colors"
                >
                    原稿アップロード
                </button>
                <span className="text-sm text-gray-500">またはファイルをここにドロップ</span>
                <button
                    type="button"
                    onClick={() => setIsUsingOriginalScript(prev => !prev)}
                    className={`py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                        isUsingOriginalScript
                            ? 'bg-violet-500 hover:bg-violet-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title={isUsingOriginalScript ? '原稿を使用（ON）' : '原稿を使用（OFF）'}
                >
                    原稿を使用: {isUsingOriginalScript ? 'ON' : 'OFF'}
                </button>
             </div>

             
            <div className="px-1">
                <span className="text-sm font-bold text-gray-700 ">プロンプト</span>
                <div className="flex items-center gap-2 min-w-0">
                    <input
                        type="text"
                        value={prompt}
                        onChange={handlePromptInput}
                        aria-label="プロンプト"
                        className="w-full py-1 px-2 text-center text-sm font-medium text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                </div>
            </div>

            {/* AI自動書き換え */}
            {isUsingOriginalScript && ( <button
                type="button"
                disabled={isExpanding}
                className={`w-full my-3 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border shadow-sm ${
                    isExpanding
                        ? 'bg-gray-300 text-gray-500 border-gray-400 grayscale cursor-not-allowed'
                        : 'bg-violet-500 hover:bg-violet-600 text-white border-violet-600'
                }`}
                onClick={() => {if(isUsingOriginalScript){handleAutoExpand()}else{handleAutoRewrite()}}}
            >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{isExpanding ? '処理中...' : '書き換え開始'}</span>
            </button>
            )} 
        </div>
    )
}