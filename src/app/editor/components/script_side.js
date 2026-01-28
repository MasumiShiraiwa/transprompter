"use client"

import { useState, useEffect, useRef, useId, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function ScriptSide( {script, setScript, speaker_list, setSpeakerList, current_position, setCurrentPosition, selectedSpeaker, setSelectedSpeaker, groupIndex, setGroupIndex, syncData, yjsInstance} ) {
    const scrollRef = useRef(null);
    const router = useRouter();
    const [editIndex, setEditIndex] = useState(null);
    // const id = useId(); // これを使うと、ブラウザのデベロッパーツールで、idが変わるため、デバッグが困難になる。

    // キーボードイベントのハンドリング
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setEditIndex(null);
                setGroupIndex([]);
                setSelectedSpeaker(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editIndex, selectedSpeaker]);

    useEffect(() => { // 選択されたスピーカーが変更されたときに、speaker_listとYJSを更新する
        async function updateSpeaker() {
            if(editIndex !== null && selectedSpeaker !== null){
                setSpeakerList(prevSpeakerList => { // 必用？？
                    const newSpeakerList = [...prevSpeakerList];
                    newSpeakerList[editIndex] = selectedSpeaker;
                    return newSpeakerList;
                });
            
                await yjsInstance.updateSpeaker(editIndex, selectedSpeaker);

            }}
        updateSpeaker();
    },[selectedSpeaker])

    // 保存ボタンを押したときの処理
    const handleSave = async () => {
        // DB保存するAPI呼び出し
        const body = { scripts: script, speaker_list: speaker_list };
        const res_cue_card_saved = await fetch('/api/cue_card/update', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_cue_card_saved = await res_cue_card_saved.json();
        console.log("cue card saved: ", data_cue_card_saved);

        // PusherでPresenter側を更新する
        const res_snapshot = await fetch('/api/yjs/snapshot', {
            method: 'POST',
        });
        const data_snapshot = await res_snapshot.json();
        console.log("snapshot: ", data_snapshot);
    };

    // 台本を変更したときの処理(編集画面描画用)
    const handleScriptChange = (groupIdx, localIdx, value) => {
        setScript(prevScript => {
            const newScript = [...prevScript];
            newScript[groupIdx][localIdx] = value;
            return newScript;
        });
    };

    // 台本を変更したときの処理(同期用)
    const handleLineEnter = async (globalIdx, groupIdx, localIdx, value) => { // Enterキーが押されたときの処理
        let newScript = [...script]
        let newSpeakerList = [...speaker_list]
        if (value === "") { // 行を削除する
            if(yjsInstance.getScript(groupIdx).length > 1){
                newScript[groupIdx].splice(localIdx, 1);
            }else{
                newScript.splice(groupIdx, 1);
                yjsInstance.deleteScript(groupIdx);
        }
            yjsInstance.deleteSpeaker(globalIdx);
            newSpeakerList.splice(globalIdx, 1);
            setScript(newScript);
            setSpeakerList(newSpeakerList);
        }else{
            yjsInstance.updateSpeaker(globalIdx, selectedSpeaker);
            newSpeakerList[globalIdx] = selectedSpeaker;
            setSpeakerList(newSpeakerList);
        }
        // 本来は変えるべき！
        yjsInstance.updateScript(groupIdx, newScript[groupIdx]); 

        setEditIndex(null);
    };

    // 行を挿入したときの処理
    const handleInsertLine = async (globalIdx) => {
        setEditIndex(globalIdx);

        let newScript = [...script]
        let newSpeakerList = [...speaker_list]

        let currentIndex = 0;
        for(let i = 0; i < newScript.length; i++){
            let temp = [...newScript[i]];
            if(currentIndex <= globalIdx && currentIndex + newScript[i].length > globalIdx){
                temp.splice(globalIdx - currentIndex, 0, "");
                newScript[i] = temp;
                yjsInstance.updateScript(i, temp);
                break;
            }
            else if(currentIndex + newScript[i].length === globalIdx){
                yjsInstance.insertScript(i + 1, [""]);
                newScript.splice(i + 1, 0, [""]);

                break;
            }
            currentIndex += newScript[i].length;
        }
        setScript(newScript);

        newSpeakerList.splice(globalIdx, 0, "");
        yjsInstance.insertSpeaker(globalIdx, "");
        setSpeakerList(newSpeakerList);
    };

    // 行を選択したときの処理
    // 【要変更】同じグループに属する行もggroupIdxに追加・削除する。
    const handleSelectLine = (globalIdx, editing = false) => {
        let activeGroup = null;
        let activeGroupStartIdx = 0;
        let idx = 0;
        for (let group of script) {
            if (idx <= globalIdx && idx + group.length > globalIdx) {
                activeGroupStartIdx = idx;
                activeGroup = Array.from(
                    { length: group.length },
                    (_, k) => activeGroupStartIdx + k
                );
                break;
            }
            idx += group.length;
        }

        if (groupIndex.includes(globalIdx) && !editing) {
            setGroupIndex(prevGroupIndex => { // グループから削除
                const newGroupIndex = [...prevGroupIndex];
                activeGroup.forEach(idx => newGroupIndex.includes(idx) ? newGroupIndex.splice(newGroupIndex.indexOf(idx), 1) : null);
                return newGroupIndex;
            });
        }else{
            setGroupIndex(prevGroupIndex => { // グループに追加
                // const newGroupIndex = [...prevGroupIndex];
                const newGroupIndex = editing ? [] : [...prevGroupIndex];

                activeGroup.forEach(idx => newGroupIndex.includes(idx) ? null : newGroupIndex.push(idx));
                return newGroupIndex;
            });
        }
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
                    <div>groupIndex: {groupIndex.join(", ")}</div>
                    <h2 className="text-xl font-semibold text-gray-700">編集パネル</h2>
                </div>
                <button
                    onClick={() => handleSave()}
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
                    (() => {
                        let globalIndex = 0;
                        return script.map((lines, groupIdx) => (
                            lines.map((line, localIdx) => {
                                const index = globalIndex++;
                                return (
                                    <Fragment key={`${index}`}>
                                    <div 
                                        className={`p-3 border border-gray-300 rounded-lg transition-all duration-200 flex items-start ${
                                            current_position === index ? 'bg-red-100' : 'bg-white'
                                        } ${
                                            groupIndex.includes(index) ? 'shadow-md ring-2 ring-gray-200 z-10 scale-[1.025]' : 'shadow-sm'
                                        }`}
                                    >
                                        <span 
                                            className="text-sm text-gray-500 mr-2 mt-1 shrink-0 select-none cursor-pointer hover:text-blue-500 transition-colors"
                                            onClick={() => setCurrentPosition(index)}
                                        >
                                            {index + 1}.
                                        </span>
                                        <span className="mr-2 mt-1 font-bold text-gray-600 shrink-0">{speaker_list[index]}</span>
                                        {editIndex === index ? (
                                            <textarea
                                                value={line.replace(/\|/g, "\n")}
                                                ref={el => {
                                                    if (el) {
                                                        el.style.height = 'auto';
                                                        el.style.height = el.scrollHeight + 'px';
                                                    }
                                                }}
                                                onChange={e => handleScriptChange(groupIdx, localIdx, e.target.value)}
                                                onBlur={() => {}}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                                                        e.preventDefault();
                                                        handleLineEnter(index, groupIdx, localIdx, line);
                                                    }else if(e.key === 'Escape'){
                                                        setEditIndex(null);
                                                        setSelectedSpeaker(null);
                                                    }
                                                }}
                                                autoFocus
                                                className="w-full bg-transparent resize-none outline-none font-bold leading-relaxed overflow-hidden border-2 border-dotted border-blue-400 rounded px-1"
                                                rows={1}
                                                style={{ minHeight: '2rem' }}
                                            />
                                        ) : (
                                            <div
                                                className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                onClick={() => handleSelectLine(index)}
                                                onDoubleClick={() => {setEditIndex(index); setSelectedSpeaker(speaker_list[index]); handleSelectLine(index, true);}}
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
                            );
                            })
                        ));
                    })()
                )}
            </div>
        </div>
    )
}