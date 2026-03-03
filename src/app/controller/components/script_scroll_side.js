"use client"

import { useState, useEffect, useRef, useId, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';



export default function ScriptScrollSide( {script, setScript, newScript, setNewScript, speaker_list, setSpeakerList, current_position, setCurrentPosition, selectedSpeaker, setSelectedSpeaker, groupId, setGroupId, yjsInstance, editPermission, setEditPermission, focus, setFocus, isScrollBasedCurrentPositionSetting, scrollRef} ) {
    console.log("Current Position: ", current_position);
    const [selfUserId, setSelfUserId] = useState(null);
    const getPermissionInterval = useRef(null);
    const [edittingNewScript, setEdittingNewScript] = useState(false);
    const [visibleIndex, setVisibleIndex] = useState(null);
    const scriptRef = useRef(script);
    scriptRef.current = script;

    // idをglobalIndexに変換する(SpeakerList用)。scriptRef を参照してキー操作時も最新 script を参照する。
    const id2Index = (id) => {
        const s = scriptRef.current;
        let globalIndex = 0;
        for(let group of s) {
            for(let line of group) {
                if(line.id === id) {
                    return globalIndex;
                }
                globalIndex++;
            }
        }
        return null;
    };

    const index2Id = (index) => {
        const s = scriptRef.current;
        let globalIndex = 0;
        for(let group of s) {
            for(let line of group) {
                if(globalIndex === index) {
                    return line.id;
                }
                globalIndex++;
            }
        }
        return null;
    }

    // 自分のUserIDを生成する(削除予定)
    useEffect(() => {
        setSelfUserId(String(Math.random()));
    }, []);


    // scrollRef の表示領域の中央にある行の index を取得する
    const getVisibleIndex = () => {
        const container = scrollRef.current;
        if (!container) return null;
        const lines = container.querySelectorAll('[data-line-index]');
        const center = container.scrollTop + container.clientHeight / 2;
        for (const el of lines) {
            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;
            if (center >= top && center < bottom) {
                setVisibleIndex(parseInt(el.getAttribute('data-line-index'), 10));
                return parseInt(el.getAttribute('data-line-index'), 10);
            }
        }
        if (lines.length > 0) {
            const last = lines[lines.length - 1];
            if (center >= last.offsetTop) {
                setVisibleIndex(parseInt(last.getAttribute('data-line-index'), 10));
                return parseInt(last.getAttribute('data-line-index'), 10);
            }
            setVisibleIndex(parseInt(lines[0].getAttribute('data-line-index'), 10));
            return parseInt(lines[0].getAttribute('data-line-index'), 10);
        }
        // setVisibleIndex(null);
        return null;
    };

    useEffect(() => {
        if(isScrollBasedCurrentPositionSetting){
            const el = scrollRef.current.querySelector(`[data-line-index="${id2Index(current_position)}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },[isScrollBasedCurrentPositionSetting]);


    // キーボードイベントのハンドリング
    useEffect(() => {
        const handleKeyDown = (event) => {
            
            const target = event.target;
            if (target && target instanceof Element) {
                const isInputLike = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
                    || target.isContentEditable
                    || target.closest('input, textarea, select, [contenteditable="true"]');
                if (isInputLike) return;
            }
            event.preventDefault(); // ページのスクロールを防止

            switch(event.key){
                case 'Escape':
                    setGroupId([]);
                    setFocus(prev => ({...prev, focus: false, firstAllow: null}));
                    setSelectedSpeaker(null);
                    break;
                case ' ':
                    if(current_position === null || !scrollRef.current)return;
                    const el = scrollRef.current.querySelector(`[data-line-index="${id2Index(current_position)}"]`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [focus, current_position]);


    // 行を選択したときの処理
    const handleSelectLine = async (globalIdx, editing = false) => {
        if(globalIdx === null){return;}
        // キーボード経由でもクリック経由でも常に最新の script を参照する（useEffect のクロージャ対策）
        const currentScript = scriptRef.current;

        let activeGroup = null;
        let activeGroupScript = null;
        let activeGroupStartIdx = 0;
        let idx = 0;     

        for (let group of currentScript) { // 同一グループの取得
            if (idx <= globalIdx && idx + group.length > globalIdx) {
                activeGroupStartIdx = idx;
                activeGroup = Array.from(
                    { length: group.length },
                    (_, k) => activeGroupStartIdx + k
                );
                activeGroupScript = group
                break;
            }
            idx += group.length;
        }

        

        if (groupId.includes(index2Id(globalIdx)) && !editing) {
            setGroupId(prevGroupId => { // グループから削除
                const newGroupId = [...prevGroupId];
                // activeGroup.forEach(idx => newGroupId.includes(idx) ? newGroupId.splice(newGroupId.indexOf(idx), 1) : null); // IndexでGroupIdを管理する場合(却下)
                activeGroupScript.forEach(line => newGroupId.includes(line.id) ? newGroupId.splice(newGroupId.indexOf(line.id), 1) : null);
                return newGroupId;
            });
        }else{
            if(groupId.length > 0 && !activeGroup.includes(Math.min(...groupId.reduce((acc, id) => [...acc, id2Index(id)], [])) - 1) && !activeGroup.includes(Math.max(...groupId.reduce((acc, id) => [...acc, id2Index(id)], [])) + 1)){
                return; // 連続しない場合はグループに追加しない
            }
            setGroupId(prevGroupId => { // グループに追加                
                const newGroupId = editing ? [] : [...prevGroupId];

                // activeGroup.forEach(idx => newGroupId.includes(idx) ? null : newGroupId.push(idx));
                activeGroupScript.forEach(line => newGroupId.includes(line.id) ? null : newGroupId.push(line.id));
                return newGroupId;
            });
        }
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            
            {visibleIndex && <div className="text-sm text-gray-500">
                {visibleIndex}
            </div>}
            <div className="relative flex-1 min-h-0" style={{ maxHeight: '85vh' }}>
                <div 
                    ref={scrollRef}
                    onScroll={() => { if(isScrollBasedCurrentPositionSetting){const idx = getVisibleIndex(); if (idx != null){setVisibleIndex(idx); setCurrentPosition(index2Id(idx));}}}}
                    className="bg-white border-2 border-gray-200 rounded-lg h-full overflow-y-auto p-4 space-y-1"
                >
                    {script.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        台本が読み込まれていません
                    </div>
                ) : ( // scriptの長さが1以上の場合
                    <>
                    <div className="h-[60vh] flex items-center justify-center my-2 opacity-60"
                    data-line-index={null}>    
                    </div>
                    {(() => {
                        let globalIndex = 0;
                        return script.map((lines, groupIdx) => (
                            lines.map((line, localIdx) => {
                                const index = globalIndex++;
                                return (
                                    <Fragment key={`${index}`}>
                                        <div // ここからスクリプトボックスの表示
                                                data-line-index={index}
                                                className="relative p-3 flex flex-row items-start gap-2">
                                                <span // 1列目: 番号
                                                    className={`flex shrink-0 select-none cursor-pointer hover:text-blue-500 transition-colors ${
                                                    current_position === line.id ? 'text-blue-500 font-bold text-medium' : 'text-gray-500 text-sm'}
                                                `}
                                                    onClick={() => setCurrentPosition(line.id)}
                                                >
                                                    {index + 1}.
                                                </span>
                                                <div className="flex flex-col flex-[8]">
                                                    <span className="flex shrink-0 font-bold text-gray-600">{speaker_list.get(line.id)}</span>
                                                    <div // 3列目: テキスト
                                                            className="min-w-0 font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                            tabIndex={0}
                                                        >
                                                            {line.text === "" ? <span className="text-gray-400 font-normal"> </span> : line.text.replace(/\|/g, "\n")}
                                                    </div>
                                                </div>
                                        </div>
                                    </Fragment>
                                );
                            })
                        ));
                    })()}
                    <div className="h-[60vh] flex items-center justify-center my-2 opacity-60"
                    data-line-index={null}>
                    </div>
                    </>
                )}
                </div>
                {/* 中央位置の目印（スクロール領域の中心に固定） */}
                {isScrollBasedCurrentPositionSetting && <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-dotted border-t-2 border-blue-400/15 pointer-events-none z-10 rounded-lg"
                    aria-hidden="true"
                />}
            </div>
        </div>
    )
}