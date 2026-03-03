"use client"

import { useState, useEffect, useRef, useId, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';



export default function ScriptSide( {project_id, script, setScript, newScript, setNewScript, speaker_list, setSpeakerList, current_position, setCurrentPosition, selectedSpeaker, setSelectedSpeaker, speakerSelectTrigger, groupId, setGroupId, yjsInstance, editPermission, setEditPermission} ) {
    const scrollRef = useRef(null);
    const [editId, setEditId] = useState(null);
    const [selfUserId, setSelfUserId] = useState(null);
    const [isMultiUserMode, setIsMultiUserMode] = useState(false);
    const getPermissionInterval = useRef(null);
    const [edittingNewScript, setEdittingNewScript] = useState(false);
    const [focus, setFocus] = useState({index: null, id: null, focus: false, firstAllow: null});
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
        if (focus.index == null || !scrollRef.current) return;
        const el = scrollRef.current.querySelector(`[data-line-index="${focus.index}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focus.index]);

    const handleArrowUp = async (grouping = false) => {
        const currentScript = scriptRef.current;
        if(currentScript.flat().length === 0){return;}
        
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

    // 【確認中】権限処理あり
    const handleEnter = () => {
        releaseEditPermission(id2Index(editId)).then(result => {
            if(result){
                getEditPermission(focus.index).then(result => {
                    if(result){
                        setEditId(index2Id(focus.index));
                        setSelectedSpeaker(speaker_list.get(index2Id(focus.index)));
                        handleSelectLine(focus.index, true);
                        getPermissionInterval.current = setInterval(expandEditPermission, 10*1000);
                    }
                });
            }else{console.log("unlock failed in handleEnter: ", focus.index);}
        });
    }
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
                case 'Enter':
                    if(event.shiftKey || event.ctrlKey){
                        if(focus.focus){
                            handleInsertLine(focus.index + 1);
                        }else if(script.flat().length === 0){
                            handleInsertFirstLine();
                        }
                    }else{
                        if(focus.focus){handleEnter();}
                    }

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
                case 'Delete':
                    handleDeleteLine(focus.index);
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editId, focus, current_position, yjsInstance]);

    useEffect(() => { // 選択されたスピーカーが変更されたときに、speaker_listとYJSを更新する
        async function updateSpeaker() {

            if(editId !== null && selectedSpeaker !== null){
                setSpeakerList(prevSpeakerList => {
                    const newSpeakerList = new Map(prevSpeakerList);
                    newSpeakerList.set(editId, selectedSpeaker);
                    return newSpeakerList;
                });
            
                await yjsInstance.updateSpeaker(editId, selectedSpeaker);

            }else if(focus.index !== null && focus.focus && selectedSpeaker !== null){
                setSpeakerList(prevSpeakerList => {
                    const newSpeakerList = new Map(prevSpeakerList);
                    newSpeakerList.set(index2Id(focus.index), selectedSpeaker);
                    return newSpeakerList;
                });
                yjsInstance.updateSpeaker(index2Id(focus.index), selectedSpeaker);
            }
        }
        updateSpeaker();
    },[selectedSpeaker, speakerSelectTrigger])

    useEffect(() => {
        if(!edittingNewScript && newScript.length > 0){
            const currentLen = scriptRef.current.flat().length;
            const targetLen = newScript.length;
            if(currentLen < targetLen){
                const diff = targetLen - currentLen;
                // 追加するIDをeffect内で1回だけ生成
                const idsToAdd = Array.from({ length: diff }, () => uuidv4());
                // 副作用はeffect内で1回だけ
                idsToAdd.forEach(id => {
                    yjsInstance.pushScript([{ id, text: "" }]);
                });
                // updaterは純粋: prev と idsToAdd だけで決まる
                setScript(prev => {
                    const temp = [...prev];
                    idsToAdd.forEach(id => temp.push([{ id, text: "" }]));
                    return temp;
                });
            }else if(currentLen > targetLen){
                const diff = currentLen - targetLen;
                setNewScript(prev => {
                    const temp = [...prev];
                    for(let i = 0; i < diff; i++){
                        temp.push(undefined)
                    }
                    return temp;
                });
            }
            setEdittingNewScript(true);    
        }else if(edittingNewScript && newScript.length === 0){
            setEdittingNewScript(false);
        }
    }, [newScript]);

    // 保存ボタンを押したときの処理
    const handleSave = async () => {
        // DB保存するAPI呼び出し
        let body = { scripts: script, speaker_list: Object.fromEntries(speaker_list) };
        console.log("speaker_list: ", typeof speaker_list);
        const res_cue_card_saved = await fetch('/api/cue_card/update', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_cue_card_saved = await res_cue_card_saved.json();
        console.log("cue card saved: ", data_cue_card_saved);

        // YJSのスナップショットを取得する
        body = { script: script };
        const res_snapshot = await fetch('/api/yjs/snapshot', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({script: script, project_id: project_id}),
        });
        const data_snapshot = await res_snapshot.json();
        console.log("snapshot: ", data_snapshot);
    };

    // 台本を変更したときの処理(編集画面描画用)
    const handleScriptChange = (groupIdx, localIdx, value) => {
        setScript(prevScript => {
            const tempScript = [...prevScript];
            tempScript[groupIdx][localIdx].text = value;
            return tempScript;
        });
    };

    // 台本を変更したときの処理(同期用)
    const UpdateLine = async (globalIdx, groupIdx, localIdx, value) => { // Enterキーが押されたときの処理
        let tempScript = [...script]
        let newSpeakerList = new Map(speaker_list);
        if (value === "") { // 行を削除する
            if(yjsInstance.getScript(groupIdx).length > 1){
                yjsInstance.deleteSpeaker(tempScript[groupIdx][localIdx].id);
                newSpeakerList.delete(tempScript[groupIdx][localIdx].id);
                tempScript[groupIdx].splice(localIdx, 1);
                yjsInstance.updateScript(groupIdx, tempScript[groupIdx]); 
            }else{
                yjsInstance.deleteSpeaker(tempScript[groupIdx][localIdx].id);
                newSpeakerList.delete(tempScript[groupIdx][localIdx].id);
                tempScript.splice(groupIdx, 1);
                yjsInstance.deleteScript(groupIdx);
            }

            setScript(tempScript);
            setSpeakerList(newSpeakerList);
            if(globalIdx > tempScript.flat().length - 1){
                if(globalIdx - 1 < 0){
                    setFocus(prev => ({...prev, index: null, id: null, focus: false, firstAllow: null}));
                }else{
                    setFocus(prev => ({...prev, index: globalIdx - 1, focus: true, firstAllow: null}));
                }
                setFocus(prev => ({...prev, firstAllow: null}));
            }

        }else{
            yjsInstance.transact(() => {
                yjsInstance.updateSpeaker(tempScript[groupIdx][localIdx].id, selectedSpeaker);
                yjsInstance.updateScript(groupIdx, tempScript[groupIdx]);
            });
            newSpeakerList.set(tempScript[groupIdx][localIdx].id, selectedSpeaker);
            setSpeakerList(newSpeakerList);
        }
        setEditId(null);
    };

    // 行を挿入したときの処理
    const handleInsertLine = async (globalIdx) => {
        console.log("handleInsertLine: ", script.length, script.flat().length, globalIdx, yjsInstance);
        const newId = uuidv4();
        setEditId(newId);
        setFocus(prev => ({...prev, index: globalIdx, id: newId, focus: true}));

        let tempScript = [...script]
        let newSpeakerList = new Map(speaker_list);

        let currentIndex = 0;
        for(let i = 0; i < tempScript.length; i++){
            let temp = [...tempScript[i]];
            if(currentIndex <= globalIdx && currentIndex + tempScript[i].length > globalIdx){
                temp.splice(globalIdx - currentIndex, 0, {id: newId, text: ""});
                tempScript[i] = temp;
                yjsInstance.updateScript(i, temp);
                break;
            }
            else if(currentIndex + tempScript[i].length === globalIdx){
                yjsInstance.insertScript(i + 1, [{id: newId, text: ""}]);
                tempScript.splice(i + 1, 0, [{id: newId, text: ""}]);
                break;
            }
            currentIndex += tempScript[i].length;
        }
        setScript(tempScript);

        newSpeakerList.set(newId, "");
        yjsInstance.updateSpeaker(newId, "");
        setSpeakerList(newSpeakerList);

        const res_lock = await fetch('/api/edit_lock/lock', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ scriptIds: [newId], userId: selfUserId }),
        });
        const data_lock = await res_lock.json();
        if(!data_lock.result){
            console.log("lock failed: ", [newId]);
            return false;
        }
    };

    // 新規作成後の最初の行を挿入したときの処理
    const handleInsertFirstLine = async () => {
        const newId = uuidv4();
        setEditId(newId);
        console.log("yjsInstance: ", yjsInstance);
        yjsInstance.pushScript([{id: newId, text: ""}]);
        yjsInstance.updateSpeaker(newId, null);
        setScript([[{id: newId, text: ""}]]);
        setSpeakerList(new Map([[newId, null]]));
        setFocus({index: 0, id: newId, focus: true, firstAllow: null});
    }

    // 行を削除したときの処理
    // 【確認中】権限処理あり
    const handleDeleteLine = async (globalIdx) => {
        if(script.flat().length !== yjsInstance.getScript().flat().length){
            console.log("script and yjsInstance are not in sync: ", script.flat().length, yjsInstance.getScript().flat().length);
            return;
        }
        if(globalIdx === null){return;}
        let tempScript = [...script];
        let newSpeakerList = new Map(speaker_list);

        for(const [key, value] of Object.entries(editPermission)){
            if(key.startsWith(index2Id(globalIdx)) && value !== selfUserId){
                return;
            }
        }

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
        if(activeGroup === null){
            return;
        }
        if(activeGroup.length > 1){
            tempScript[groupIdx].splice(globalIdx - currentIndex, 1);
            yjsInstance.updateScript(groupIdx, tempScript[groupIdx]);
        }else{
            tempScript.splice(groupIdx, 1);
            yjsInstance.deleteScript(groupIdx);
        }
        setScript(tempScript);


        newSpeakerList.delete(id);
        yjsInstance.deleteSpeaker(id);
        setSpeakerList(newSpeakerList);

        // フォーカスを更新する
        if(globalIdx > tempScript.flat().length - 1){
            if(globalIdx - 1 < 0){
                setFocus(prev => ({...prev, index: null, id: null, focus: false, firstAllow: null}));
            }else{
                setFocus(prev => ({...prev, index: globalIdx - 1, focus: true, firstAllow: null}));
            }
            setFocus(prev => ({...prev, firstAllow: null}));
        }
    }

    // 行を選択したときの処理
    // 【要変更】同じグループに属する行もgroupIdxに追加・削除する。
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

        
        if(activeGroup === null){
            return;
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

    // グループの編集権限を取得する
    const getEditPermission = async (globalIdx) => {
        let activeGroup = null;
        let activeGroupScript = null;
        let activeGroupStartIdx = 0;
        let idx = 0;     

        let start = performance.now();
        console.log("getEditPermission start");

        for (let group of script) { // 同一グループの取得
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
        console.log("editPermission: ", activeGroupScript.map(line => line.id), [activeGroupScript.map(line => editPermission[line.id] !== undefined)]);

        console.log("Getting Group time: ", performance.now() - start);
        start = performance.now();

        // 他のユーザが編集中かどうか確かめる.
        const isLocked = activeGroupScript.some(line => editPermission[line.id] !== undefined && editPermission[line.id] !== selfUserId);
        if(isLocked){
            console.log("line is locked: ", activeGroupScript.map(line => line.id));
            return false;
        }

        if(!isMultiUserMode){
            return true;
        }

        console.log("Checking Lock by other users time: ", performance.now() - start);
        start = performance.now();

        const res_lock = await fetch('/api/edit_lock/lock', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ scriptIds: activeGroupScript.map(line => line.id), userId: selfUserId, project_id: project_id }),
        });
        const data_lock = await res_lock.json();
        data_lock.result && console.log("lock success: ", activeGroupScript.map(line => line.id));

        console.log("Locking API time: ", performance.now() - start);
        start = performance.now();

        if(!data_lock.result){
            console.log("lock failed: ", activeGroupScript.map(line => line.id));
            return false;
        }

        setEditPermission(prev => {
            const newEditPermission = {...prev};
            activeGroupScript.forEach(line => newEditPermission[line.id] = selfUserId);
            return newEditPermission;
        });

        console.log("Release Edit Permission(Local) time: ", performance.now() - start);

        return true;
    }

    // グループの編集権限を解放する
    const releaseEditPermission = async (globalIdx) => {
        if(getPermissionInterval.current !== null){
            clearInterval(getPermissionInterval.current);
            getPermissionInterval.current = null;
        }
        if(globalIdx === null){
            return true;
        }

        let activeGroup = null;
        let activeGroupScript = null;
        let activeGroupStartIdx = 0;
        let idx = 0;     

        let start = performance.now();
        for (let group of script) { // 同一グループの取得
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

        console.log("Getting Group time: ", performance.now() - start);
        start = performance.now();

        const res_unlock = await fetch('/api/edit_lock/unlock', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ scriptIds: activeGroupScript.map(line => line.id), userId: selfUserId, project_id: project_id }),
        });
        const data_unlock = await res_unlock.json();
        data_unlock.result && console.log("unlock success: ", activeGroupScript.map(line => line.id));

        if(!data_unlock.result){
            console.log("unlock failed: ", activeGroupScript.map(line => line.id));
            return false;
        }

        console.log("Unlocking API time: ", performance.now() - start);
        start = performance.now();

        setEditPermission(prev => {
            const newEditPermission = {...prev};
            activeGroupScript.forEach(line => delete newEditPermission[line.id]);
            return newEditPermission;
        });
        console.log("Release Edit Permission(Local) time: ", performance.now() - start);

        return true;
    }

    // グループの編集権限を延長/更新する
    const expandEditPermission = async () => {
        const res_expand = await fetch('/api/edit_lock/expand', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: selfUserId }),
        });
        const data_expand = await res_expand.json();
        console.log("expand success: ", data_expand.result);
        return data_expand.result;
    }

    // 自動生成後の台本を承認/却下する(最新版)
    const applyNewScript = async (globalIdx, groupIdx, localIdx, approve = true) => {
        let tempScript = [...script]
        if(newScript[globalIdx] !== undefined){ // 上書きor延長の場合
            if(approve){ // 承認の場合
                tempScript[groupIdx][localIdx].text = newScript[globalIdx];
                yjsInstance.updateScript(groupIdx, tempScript[groupIdx]);
                setScript(tempScript);
                setNewScript(prev => {
                    const temp = [...prev];
                    temp[globalIdx] = "";
                    return temp;
                });
                return;
            }else{ // 却下の場合
                if(tempScript[groupIdx][localIdx].text === ""){ // 拡張予定だった行を却下する場合
                    tempScript.splice(groupIdx, 1);
                    yjsInstance.deleteScript(groupIdx);
                    setScript(tempScript);
                    setNewScript(prev => {
                        const temp = [...prev];
                        temp.splice(globalIdx, 1);
                        return temp;
                    });
                    return;
                }else{ // 上書き予定だった行を却下する場合
                    setNewScript(prev => {
                        const temp = [...prev];
                        temp[globalIdx] = "";
                        return temp;
                    });
                    return;
                }
            }
        }else{ // 削除の場合
            if(approve){ // 承認の場合
                if(tempScript[groupIdx].length > 1){ // 行が複数の場合
                    tempScript[groupIdx].splice(localIdx, 1);
                    yjsInstance.updateScript(groupIdx, tempScript[groupIdx]);
                    setScript(tempScript);
                    setNewScript(prev => {
                        const temp = [...prev];
                        temp.splice(globalIdx, 1);
                        return temp;
                    });
                    return;
                }else{ // 行が1つの場合
                    tempScript.splice(groupIdx, 1);
                    yjsInstance.deleteScript(groupIdx);
                    setScript(tempScript);
                    setNewScript(prev => {
                        const temp = [...prev];
                        temp.splice(globalIdx, 1);
                        return temp;
                    });
                    return;
                }
            }else{ // 却下の場合
                setNewScript(prev => {
                    const temp = [...prev];
                    temp[globalIdx] = "";
                    return temp;
                });
                return;
            }
        }
    }

    const applyAllNewScript = async (approve = true) => {

        console.log("applyAllNewScript script: ", script);
        console.log("applyAllNewScript newScript: ", newScript);
        if(approve){
            let tempScript = [...script];
            let globalIdx = 0;
            for(let i = 0; i < tempScript.length; i++){
                for(let j = 0; j < tempScript[i].length; j++){
                    if(newScript[globalIdx] !== undefined && newScript[globalIdx] !== ""){
                        tempScript[i][j].text = newScript[globalIdx];
                        yjsInstance.updateScript(i, tempScript[i]);
                    }
                    globalIdx++;
                }
            }
            setScript(tempScript);
            setNewScript(() => {
                return [];
            });
            // if(tempScript.flat().length >= newScript.length){
            //     for(let i = 0; i < tempScript.length; i++){
            //         for(let j = 0; j < tempScript[i].length; j++){
            //             if(newScript[i] !== undefined && newScript[i] !== ""){
            //                 tempScript[i][j].text = newScript[i];
            //             }
            //         }
            //         yjsInstance.updateScript(i, tempScript[i]);
            //     }
            // }else{
            //     const diff = newScript.length - tempScript.flat().length;
            //     for(let i = 0; i < tempScript.length; i++){
            //         for(let j = 0; j < tempScript[i].length; j++){
            //             if(newScript[i] !== undefined && newScript[i] !== ""){
            //                 tempScript[i][j].text = newScript[i];
            //             }
            //         }
            //         yjsInstance.updateScript(i, tempScript[i]);
            //     }
            //     for(let i = tempScript.flat().length; i < newScript.length; i++){
            //         const newLine = { id: uuidv4(), text: newScript[i] };
            //         yjsInstance.pushScript([newLine]);
            //         tempScript.push([newLine]);
            //     }
            //     setScript(tempScript);
            //     setNewScript(() => {
            //         return [];
            //     });
            // }
        }else{
            // すべて却下 - 削除対象を収集してから末尾から削除し、インデックス整合性を保つ
            let tempScript = script.map(group => [...group]);
            let globalIdx = 0;
            const toDelete = [];
            for(let i = 0; i < tempScript.length; i++){
                for(let j = 0; j < tempScript[i].length; j++){
                    if(tempScript[i][j].text === "" && tempScript[i][j].text !== newScript[globalIdx]){
                        toDelete.push({ i, j, deleteEntireGroup: tempScript[i].length === 1 });
                    }
                    globalIdx++;
                }
            }
            // インデックスがずれないよう、降順で削除（後ろから処理）
            toDelete.sort((a, b) => (a.i !== b.i) ? b.i - a.i : b.j - a.j);
            for(const { i, j, deleteEntireGroup } of toDelete){
                if(deleteEntireGroup){
                    tempScript.splice(i, 1);
                    yjsInstance.deleteScript(i);
                }else{
                    tempScript[i].splice(j, 1);
                    yjsInstance.updateScript(i, tempScript[i]);
                }
            }
            setScript(tempScript);
            setNewScript(() => []);
        }
    }

    const clearNewScript = () => {
        setNewScript(prev => {
            if (prev.every(line => line === "")) {
                return [];
            }
            return prev;
        });
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="text-xs border border-gray-300 rounded p-2 bg-white max-w-md break-words whitespace-pre-line">
                    {(() => {
                        const t = script.flat().find(line => line.id === current_position)?.text?.replace(/\|/g, "") ?? "—";
                        return t.length > 12 ? `${t.slice(0, 20)}...` : t;
                    })()}
                </div>
                {newScript.length > 0 && (
                    <>
                    <button
                        onClick={() => applyAllNewScript(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                        変更を承認
                    </button>
                    <button
                        onClick={() => applyAllNewScript(false)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                        変更を却下
                    </button>
                    </>
                    )}

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
                    <>
                        <div 
                        className="h-4 flex items-center justify-center cursor-pointer group/divider"
                        onClick={() => handleInsertFirstLine()}
                        >
                            <div className="w-full h-0.5 bg-blue-300  group-hover/divider:opacity-100 transition-opacity rounded-full relative">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs  group-hover/divider:opacity-100 transition-opacity">
                                    +
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center h-full text-gray-500">
                            台本が読み込まれていません
                        </div>
                    </>
                ) : ( // scriptの長さが1以上の場合
                    (() => {
                        let globalIndex = 0;
                        return script.map((lines, groupIdx) => (
                            lines.map((line, localIdx) => {
                                const index = globalIndex++;
                                return (
                                    <Fragment key={`${index}`}>
                                        {!edittingNewScript ? (
                                            <div // ここからスクリプトボックスの表示
                                                data-line-index={index}
                                                className={`relative p-3 border border-gray-300 rounded-lg transition-all duration-200 flex items-start ${
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
                                                >
                                                    {index + 1}.
                                                </span>
                                                <span className="mr-2 mt-1 font-bold text-gray-600 shrink-0">{speaker_list.get(line.id)}</span>
                                                {editId === line.id ? (
                                                    <textarea
                                                        value={line.text.replace(/\|/g, "\n")}
                                                        ref={el => {
                                                            if (el) {
                                                                el.style.height = 'auto';
                                                                el.style.height = el.scrollHeight + 'px';
                                                            }
                                                        }}
                                                        onChange={e => handleScriptChange(groupIdx, localIdx, e.target.value)}
                                                        onFocus={e =>
                                                            e.currentTarget.setSelectionRange(999, 999)
                                                          }
                                                        onBlur={() => {}}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                                                                e.preventDefault();
                                                                UpdateLine(index, groupIdx, localIdx, line.text);
                                                                releaseEditPermission(index);
                                                                setSelectedSpeaker(null);
                                                            }else if(e.key === 'Escape'){
                                                                setEditId(null);
                                                                setGroupId([]);
                                                                setSelectedSpeaker(null);
                                                                releaseEditPermission(index);
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
                                                        onClick={() => {setFocus(prev => ({...prev, index: index, focus: true})); handleSelectLine(index);}}
                                                        onDoubleClick={() => {releaseEditPermission(id2Index(editId)).then(result => {if(result){getEditPermission(index).then(result => {if(result){setEditId(line.id); setSelectedSpeaker(speaker_list.get(line.id)); handleSelectLine(index, true); getPermissionInterval.current = setInterval(expandEditPermission, 10*1000);}});}});}}
                                                        tabIndex={0}
                                                        role="button"
                                                    >
                                                        {line.text === "" ? <span className="text-gray-400 font-normal">ダブルクリックして入力...</span> : line.text.replace(/\|/g, "\n")}
                                                    </div>
                                                )}
                                            </div>
                                        ):( // 自動生成後の台本表示/承認待ち
                                            <div data-line-index={index}>
                                                <div>
                                                    {newScript[index] === "" ? ( // ""の場合は、もとの台本のみを表示する
                                                        <div
                                                            className='relative p-3 my-2 bg-white border border-gray-300 rounded-lg transition-all duration-200 flex'>
                                                            <div 
                                                                className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                                >
                                                                {line.text === "" ? <span className="text-gray-400 font-normal">ダブルクリックして入力...</span> : line.text.replace(/\|/g, "\n")}
                                                            </div>
                                                        </div>
                                                    ) : ( // それ以外（"XXX"かundefined）の場合は、承認/却下の表示を行う
                                                        <>
                                                            <div
                                                                className='relative p-3 my-2 bg-red-300/30 border border-gray-300 rounded-lg transition-all duration-200 flex'>
                                                                <div 
                                                                    className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                                    onClick={() => {applyNewScript(index, groupIdx, localIdx, false).then(() => {clearNewScript();});}}
                                                                    >
                                                                    {line.text === "" || line.text === undefined ? <span className="text-gray-400 font-normal">ダブルクリックして入力...</span> : line.text.replace(/\|/g, "\n")}
                                                                </div>
                                                            </div>
                                                            
                                                            <div
                                                                className='relative p-3 my-2 bg-green-300/30  border border-gray-300 rounded-lg transition-all duration-200 flex'>
                                                                <div 
                                                                    className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                                    onClick={() => {applyNewScript(index, groupIdx, localIdx, true).then(() => {clearNewScript();});}}
                                                                    >
                                                                    {newScript[index]}
                                                                </div>
                                                            </div>

                                                            {groupIdx === script.length - 1 &&
                                                            newScript.slice(index + 1).map((text, i) => 
                                                            <Fragment key={`${index + i}`}> 
                                                            
                                                            <div
                                                                className='relative p-3 my-2 bg-red-300/30 border border-gray-300 rounded-lg transition-all duration-200 flex'>
                                                                <div 
                                                                    className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                                    onClick={() => {applyNewScript(index + i, groupIdx + i, 1, false).then(() => {clearNewScript();});}}
                                                                    >
                                                                </div>
                                                            </div>
                                                            <div className='relative p-3 my-2 bg-green-300/30  border border-gray-300 rounded-lg transition-all duration-200 flex'>
                                                                <div 
                                                                    className="w-full font-bold leading-relaxed whitespace-pre-line cursor-pointer min-h-[1.5em]"
                                                                    onClick={() => {applyNewScript(index + i, groupIdx + i, 1, true).then(() => {clearNewScript();});}}
                                                                    >
                                                                    {text} ll
                                                                </div>
                                                            </div></Fragment>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                       
                                    {edittingNewScript? (
                                        null
                                    ):(
                                        <>
                                        {/* 行間の挿入エリア */}
                                        {(editPermission[line.id] !== undefined && editPermission[line.id] !== selfUserId) ? (
                                            null                                    
                                        ) : (
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
                                        )}
                                        </>
                                        
                                    )}
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