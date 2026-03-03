"use client"

import { useState, useEffect, useRef, useId, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';



export default function ScriptBoxSide( {script, setScript, newScript, setNewScript, speaker_list, setSpeakerList, current_position, setCurrentPosition, selectedSpeaker, setSelectedSpeaker, groupId, setGroupId, yjsInstance, editPermission, setEditPermission, focus, setFocus, isTrackingCurrentPosition} ) {
    const scrollRef = useRef(null);
    const [selfUserId, setSelfUserId] = useState(null);
    const getPermissionInterval = useRef(null);
    const [edittingNewScript, setEdittingNewScript] = useState(false);
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

    useEffect(() => {
        if (focus.index == null || !scrollRef.current ||    isTrackingCurrentPosition) return;
        const el = scrollRef.current.querySelector(`[data-line-index="${focus.index}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focus.index, isTrackingCurrentPosition]);

    useEffect(() => {
        if(isTrackingCurrentPosition){
            const el = scrollRef.current.querySelector(`[data-line-index="${id2Index(current_position)}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [current_position, isTrackingCurrentPosition]);

    const handleArrowUp = async (grouping = false) => {
        const currentScript = scriptRef.current;
        const flatLength = currentScript ? currentScript.reduce((acc, group) => acc + group.length, 0) : 0;
        if(flatLength === 0){return;}

        if(focus.focus){
            const currentIndex = focus.index;
            if(grouping){
                let idx = 0;
                let activeGroupStartIdx = 0;
                let activeGroup = null;
                for (let group of currentScript) { // 同一グループの取得
                    if (idx <= currentIndex && idx + group.length > currentIndex) {
                        activeGroupStartIdx = idx;
                        activeGroup = Array.from(
                            { length: group.length },
                            (_, k) => activeGroupStartIdx + k
                        );
                        break;
                    }
                    idx += group.length;
                }
                let nextIndex = Math.min(...activeGroup) - 1;
                if(nextIndex < 0){return;}
                if(!groupId.includes(index2Id(nextIndex))){ // 次の行が、選択済みグループに属していない場合
                    handleSelectLine(nextIndex);
                }else{
                    handleSelectLine(currentIndex);
                }
                setFocus(prev => ({...prev, index: nextIndex, focus: true}));
            }else{
                const nextIndex = Math.max(0, currentIndex - 1);
                if(!groupId.includes(index2Id(nextIndex))){ // 次の行が、選択済みグループに属していない場合
                    setGroupId([]);
                    handleSelectLine(nextIndex);
                }
                setFocus(prev => ({...prev, index: nextIndex, focus: true}));
            }

        }else{
            const nextIndex = focus.index === null? 0 : focus.index;
            setFocus(prev => ({...prev, index: nextIndex, focus: true}));
            handleSelectLine(nextIndex);
        }
    }

    const handleArrowDown = async (grouping = false) => {
        const currentScript = scriptRef.current;
        const flatLength = currentScript ? currentScript.reduce((acc, group) => acc + group.length, 0) : 0;
        if(flatLength === 0){return;}

        if(focus.focus){
            const currentIndex = focus.index;
            if(grouping){
                let idx = 0;
                let activeGroupStartIdx = 0;
                let activeGroup = null;
                for (let group of currentScript) { // 同一グループの取得
                    if (idx <= currentIndex && idx + group.length > currentIndex) {
                        activeGroupStartIdx = idx;
                        activeGroup = Array.from(
                            { length: group.length },
                            (_, k) => activeGroupStartIdx + k
                        );
                        break;
                    }
                    idx += group.length;
                }
                let nextIndex = Math.max(...activeGroup) + 1;
                if(nextIndex >flatLength - 1){return;}
                if(!groupId.includes(index2Id(nextIndex))){ // 次の行が、選択済みグループに属していない場合
                    handleSelectLine(nextIndex);
                }else{
                    handleSelectLine(currentIndex);
                }
                setFocus(prev => ({...prev, index: nextIndex, focus: true}));
            }else{
                const nextIndex = Math.min(flatLength - 1, currentIndex + 1);
                if(!groupId.includes(index2Id(nextIndex))){ // 次の行が、選択済みグループに属していない場合
                    setGroupId([]);
                    handleSelectLine(nextIndex);
                }
                setFocus(prev => ({...prev, index: nextIndex, focus: true}));
            }
            
        }else{
            const nextIndex = focus.index === null? 0 : focus.index;
            setFocus(prev => ({...prev, index: nextIndex, focus: true}));
            handleSelectLine(nextIndex);
        }
    }

    // const handleEnter = () => {
    //     releaseEditPermission(id2Index(editId)).then(result => {
    //         if(result){
    //             getEditPermission(focus.index).then(result => {
    //                 if(result){
    //                     setEditId(index2Id(focus.index));
    //                     setSelectedSpeaker(speaker_list.get(index2Id(focus.index)));
    //                     handleSelectLine(focus.index, true);
    //                     getPermissionInterval.current = setInterval(expandEditPermission, 10*1000);
    //                 }
    //             });
    //         }else{console.log("unlock failed in handleEnter: ", focus.index);}
    //     });
    // }

    // キーボードイベントのハンドリング
    useEffect(() => {
        const handleKeyDown = (event) => {
            // 入力要素にフォーカスがある場合は無視する（キーが押された要素で判定する）
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
                    setFocus(prev => ({...prev, focus: false}));
                    break;
                case 'ArrowUp':
                    handleArrowUp(event.ctrlKey || event.shiftKey);
                    break;
                case 'ArrowDown':
                    handleArrowDown(event.ctrlKey || event.shiftKey);
                    break;
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
                // case 'Delete':
                //     handleDeleteLine(focus.index);
                //     break;

            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [focus, current_position]);

    
    const handleDeleteLine = async (globalIdx) => {
        if(globalIdx === null){return;}
        let tempScript = [...script];
        let newSpeakerList = new Map(speaker_list);

        const id = index2Id(globalIdx);

        let groupIdx = 0;
        let activeGroup = null;
        let activeGroupStartIdx = 0;
        let currentIndex = 0;

        for (let group of tempScript) {
            if (currentIndex <= globalIdx && currentIndex + group.length > globalIdx) {
                activeGroupStartIdx = currentIndex;
                activeGroup = group;
                break;
            }
            groupIdx++;
            currentIndex += group.length;
        }

        if(activeGroup.length > 1){
            tempScript[groupIdx].splice(globalIdx - currentIndex, 1);
            yjsInstance.updateScript(groupIdx, tempScript[groupIdx]);
        }else{
            tempScript.splice(groupIdx, 1);
            yjsInstance.deleteScript(groupIdx);
        }

        newSpeakerList.delete(id);
        yjsInstance.deleteSpeaker(id);
        setScript(tempScript);
        setSpeakerList(newSpeakerList);
    }


    // 行を選択したときの処理
    const handleSelectLine = async (globalIdx, editing = false) => {
        if(globalIdx === null || script.flat().length <= globalIdx){return null;}

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



    // // グループの編集権限を取得する
    // const getEditPermission = async (globalIdx) => {
    //     let activeGroup = null;
    //     let activeGroupScript = null;
    //     let activeGroupStartIdx = 0;
    //     let idx = 0;     

    //     const start = performance.now();
    //     console.log("getEditPermission start: ", start);

    //     for (let group of script) { // 同一グループの取得
    //         if (idx <= globalIdx && idx + group.length > globalIdx) {
    //             activeGroupStartIdx = idx;
    //             activeGroup = Array.from(
    //                 { length: group.length },
    //                 (_, k) => activeGroupStartIdx + k
    //             );
    //             activeGroupScript = group
    //             break;
    //         }
    //         idx += group.length;
    //     }
    //     console.log("editPermission: ", activeGroupScript.map(line => line.id), [activeGroupScript.map(line => editPermission[line.id] !== undefined)]);
    //     const isLocked = activeGroupScript.some(line => editPermission[line.id] !== undefined && editPermission[line.id] !== selfUserId);
    //     if(isLocked){
    //         console.log("line is locked: ", activeGroupScript.map(line => line.id));
    //         return false;
    //     }

    //     const res_lock = await fetch('/api/edit_lock/lock', {
    //         method: 'POST',
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({ scriptId: activeGroupScript.map(line => line.id), userId: selfUserId }),
    //     });
    //     const data_lock = await res_lock.json();
    //     data_lock.result && console.log("lock success: ", activeGroupScript.map(line => line.id));

    //     if(!data_lock.result){
    //         console.log("lock failed: ", activeGroupScript.map(line => line.id));
    //         return false;
    //     }

    //     setEditPermission(prev => {
    //         const newEditPermission = {...prev};
    //         activeGroupScript.forEach(line => newEditPermission[line.id] = selfUserId);
    //         return newEditPermission;
    //     });


    //     return true;

    // }

    // // グループの編集権限を解放する
    // const releaseEditPermission = async (globalIdx) => {
    //     if(getPermissionInterval.current !== null){
    //         clearInterval(getPermissionInterval.current);
    //         getPermissionInterval.current = null;
    //     }
    //     if(globalIdx === null){
    //         return true;
    //     }

    //     let activeGroup = null;
    //     let activeGroupScript = null;
    //     let activeGroupStartIdx = 0;
    //     let idx = 0;     
        
    //     for (let group of script) { // 同一グループの取得
    //         if (idx <= globalIdx && idx + group.length > globalIdx) {
    //             activeGroupStartIdx = idx;
    //             activeGroup = Array.from(
    //                 { length: group.length },
    //                 (_, k) => activeGroupStartIdx + k
    //             );
    //             activeGroupScript = group
    //             break;
    //         }
    //         idx += group.length;
    //     }

    //     const res_unlock = await fetch('/api/edit_lock/unlock', {
    //         method: 'POST',
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({ scriptId: activeGroupScript.map(line => line.id), userId: selfUserId }),
    //     });
    //     const data_unlock = await res_unlock.json();
    //     data_unlock.result && console.log("unlock success: ", activeGroupScript.map(line => line.id));

    //     if(!data_unlock.result){
    //         console.log("unlock failed: ", activeGroupScript.map(line => line.id));
    //         return false;
    //     }

    //     setEditPermission(prev => {
    //         const newEditPermission = {...prev};
    //         activeGroupScript.forEach(line => delete newEditPermission[line.id]);
    //         return newEditPermission;
    //     });

    //     return true;
    // }

    // // グループの編集権限を延長/更新する
    // const expandEditPermission = async () => {
    //     const res_expand = await fetch('/api/edit_lock/expand', {
    //         method: 'POST',
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({ userId: selfUserId }),
    //     });
    //     const data_expand = await res_expand.json();
    //     console.log("expand success: ", data_expand.result);
    //     return data_expand.result;
    // }

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="text-xs border border-gray-300 rounded p-2 bg-white max-w-md break-words whitespace-pre-line">
                    {(() => {
                        const t = script.flat().find(line => line.id === current_position)?.text?.replace(/\|/g, "") ?? "—";
                        return t.length > 12 ? `${t.slice(0, 20)}...` : t;
                    })()}
                </div>
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
                                        <div // ここからスクリプトボックスの表示
                                                data-line-index={index}
                                                className={`relative p-3 my-3 border border-gray-300 rounded-lg transition-all duration-200 flex items-start ${
                                                    focus.index === index && focus.focus ? 'shadow-md ring-blue-300 ring-2 z-10 scale-[1.025]' 
                                                    : groupId.includes(line.id) ? 'shadow-md ring-gray-200 ring-2 z-10 scale-[1.025]' : 'shadow-sm'
                                                } 
                                                `}
                                            >
                                                {editPermission[line.id] !== undefined && editPermission[line.id] !== selfUserId && (
                                                    <div className="absolute -top-3 left-2 px-2 py-0.5 bg-amber-100 border border-amber-400 rounded text-xs font-medium text-amber-800 z-20">
                                                        Other user is now editting...
                                                    </div>
                                                )}
                                                <span 
                                                    className={` mr-2 mt-1 shrink-0 select-none cursor-pointer hover:text-blue-500 transition-colors ${
                                                    current_position === line.id ? 'text-blue-500 font-bold text-medium' : 'text-gray-500 text-sm'}
                                                `}
                                                    onClick={() => setCurrentPosition(line.id)}
                                                >
                                                    {index + 1}.
                                                </span>
                                                <span className="mr-2 mt-1 font-bold text-gray-600 shrink-0">{speaker_list.get(line.id)}</span>
                                                
                                                <div
                                                        className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                        onClick={() => {setFocus(prev => ({...prev, index: index, focus: true})); handleSelectLine(index);}}
                                                        tabIndex={0}
                                                        role="button"
                                                    >
                                                        {line.text === "" ? <span className="text-gray-400 font-normal"> </span> : line.text.replace(/\|/g, "\n")}
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