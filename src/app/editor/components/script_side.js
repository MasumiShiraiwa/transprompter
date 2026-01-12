"use client"

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';

export default function ScriptSide( {script, setScript, current_position, setCurrentPosition} ) {
    const scrollRef = useRef(null);
    const router = useRouter();
    const [editIndex, setEditIndex] = useState(null);

    const handleCueCardSave = async () => {
        // API呼び出し
        const body = { scripts: script };
        const res_cue_card_saved = await fetch('/api/cue_card/update', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_cue_card_saved = await res_cue_card_saved.json();
        console.log("cue card saved: ", data_cue_card_saved);
    };

    const handleScriptChange = (index, value) => { // 表示更新用
        setScript(prevScript => {
            const newScript = [...prevScript];
            newScript[index] = value;
            return newScript;
        });
    };

    const handleLineEnter = async (index, value) => { // Enterキーが押されたときの処理
        console.log(`Enter pressed at line_index: ${index}, value: ${value}`);

        const body = { index: index, text: value };
        const res_editted = await fetch('/api/pusher/editing', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_editted = await res_editted.json();
        console.log("edditing event が送信されました:", data_editted);

        if (value === "") {
            setScript(prevScript => {
                const newScript = [...prevScript];
                newScript.splice(index, 1);
                return newScript;
            });
        }

    };

    const handleInsertLine = async (index) => {
        setScript(prevScript => {
            const newScript = [...prevScript];
            newScript.splice(index, 0, "");
            return newScript;
        });
        const body = { index: index, text: "編集中..." };
        const res_inserted = await fetch('/api/pusher/inserting', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    };

    // 変える。ダブルクリックで必ず実行される。行選択→更新は右のボタンに移す
    // 行を選択したときに現在位置を更新する(誤操作が起こりやすいかも。その場合は、行の右端にボタンを用意する？)
    const handleSelectLine = (index) => {
        setCurrentPosition(index);
    }

    // 現在位置が変更されたときに目印をつける
    // DOM操作ではなく、レンダリング時にクラスを当てる方式に変更するため、ここではスクロールのみ（必要であれば）を行うか、削除します。
    // 今回は自動スクロールの要件は明示されていませんが、念のため残すならスクロール処理などを記述します。
    // ですが、ご要望は「枠の中の色が変わるようにして」とのことなので、map内のclassNameで制御するのがReact的です。
    // したがって、このuseEffectでのDOM直接操作は削除し、下のレンダリング部分で制御します。

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div>current_position: {current_position}</div>
                    <h2 className="text-xl font-semibold text-gray-700">編集パネル</h2>
                </div>
                <button
                    onClick={() => router.push('/upload')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                    アップロード画面へ
                </button>
                <button
                    onClick={() => handleCueCardSave()}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                    変更を保存
                </button>
            </div>
            <div 
                ref={scrollRef}
                className="bg-white border-2 border-gray-200 rounded-lg flex-1 overflow-y-auto p-4 space-y-1"
                style={{ maxHeight: '85vh' }}
            >
                {script.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        台本が読み込まれていません
                    </div>
                ) : ( // scriptの長さが1以上の場合
                    script.map((line, index) => (
                        <Fragment key={index}>
                            <div 
                                className={`p-3 border border-gray-300 rounded-lg shadow-sm transition-colors duration-200 flex items-start ${
                                    current_position === index ? 'bg-red-100' : 'bg-white'
                                }`}
                            >
                                <span 
                                    className="text-sm text-gray-500 mr-2 mt-1 shrink-0 select-none cursor-pointer hover:text-blue-500 transition-colors"
                                    onClick={() => handleSelectLine(index)}
                                >
                                    {index + 1}.
                                </span>
                                {editIndex === index ? (
                                    <textarea
                                        value={line.replace(/\|/g, "\n")}
                                        ref={el => {
                                            if (el) {
                                                el.style.height = 'auto';
                                                el.style.height = el.scrollHeight + 'px';
                                            }
                                        }}
                                        onChange={e => handleScriptChange(index, e.target.value)}
                                        onBlur={() => setEditIndex(null)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                                                e.preventDefault();
                                                handleLineEnter(index, line);
                                            }
                                        }}
                                        autoFocus
                                        className="w-full bg-transparent resize-none outline-none font-bold leading-relaxed overflow-hidden"
                                        rows={1}
                                        style={{ minHeight: '2rem' }}
                                    />
                                ) : (
                                    <div
                                        className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                        onDoubleClick={() => setEditIndex(index)}
                                        tabIndex={0}
                                        role="button"
                                    >
                                        {line === "" ? <span className="text-gray-400 font-normal">ダブルクリックして入力...</span> : line.replace(/\|/g, "\n")}
                                    </div>
                                )}
                            </div>
                            {/* 行間の挿入エリア */}
                            <div 
                                className="h-4 flex items-center justify-center cursor-pointer group/divider"
                                onClick={() => handleInsertLine(index + 1)}
                            >
                                <div className="w-full h-0.5 bg-blue-300 opacity-0 group-hover/divider:opacity-100 transition-opacity rounded-full relative">
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover/divider:opacity-100 transition-opacity">
                                        +
                                    </div>
                                </div>
                            </div>
                        </Fragment>
                    ))
                )}
            </div>
        </div>
    )
}