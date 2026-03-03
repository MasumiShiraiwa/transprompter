// ここは権限があるユーザーのみが利用できるパネル。
// AI書き換えボタンを押すと、すべての編集ロック権限を奪うようにする。

"use client"
import DataList from './data_list';

import { useState, useEffect } from 'react';

export default function AutoCreate({ script, setScript, setNewScript}) {
    const [originalScript, setOriginalScript] = useState([]);
    const [isUploaded, setIsUploaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const id2Index = (id) => {
        if (id == null || !script || typeof script !== 'object') return null;
        for (const [idx, line] of Object.entries(script)) {
            if (line?.id === id) return Number(idx);
        }
        return null;
    };


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
        setIsUploaded(true);
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



    // 新規作成ボタンを押したときの処理
    const handleAutoCreate = async () => {
        if(originalScript.length === 0){
            alert("原稿がアップロードされていません。");
            return;
        }
        setIsProcessing(true);
        setIsUploaded(false);
    }


    return (
        <div>
            {/* Wordファイルアップロード */}
            <div
                className={`mb-3 p-4 rounded-lg border-2 border-dashed transition-colors ${
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
                onClick={(event) => event.target.value = null}
                className="hidden"
                />
                <button
                    type='button'
                    onClick={() => document.getElementById("wordFileUpload").click()}
                    className="mr-2 py-1.5 px-3 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-medium text-gray-700 transition-colors"
                >
                    原稿アップロード
                </button>
                <span className="text-sm text-gray-500">またはファイルをここにドロップ</span>
                {isUploaded && (
                    <div className="mt-2 text-sm text-gray-500">
                        原稿がアップロードされました。
                    </div>
                )}
             </div>

            {/* 新規作成ボタン */}
            {!isProcessing && (
            <button
                type="button"
                disabled={!isUploaded}
                className={`w-full my-3 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-white border border-violet-600 shadow-sm ${
                    isUploaded
                        ? 'bg-violet-500 hover:bg-violet-600 cursor-pointer'
                        : 'bg-violet-500 grayscale cursor-not-allowed opacity-80'
                }`}
                onClick={() => isUploaded && handleAutoCreate()}
            >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>新規作成開始</span>
            </button>
            )}
            {isProcessing && (                    
                <div className="mt-2 text-sm text-gray-500">
                    <DataList candidate_list={originalScript} setNewScript={setNewScript} setIsProcessing={setIsProcessing} />
                </div>
            )}
        </div>
    )
}