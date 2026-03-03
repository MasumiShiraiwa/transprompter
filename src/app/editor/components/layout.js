"use client"

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/utils/pusher/client';
import { YjsInstance } from '@/app/utils/yjs/client';
import Header from '@/app/utils/header';
import ScriptSide from './script_side';
import ControlSide from './control_side';
import AutoRewriteSide from './auto_rewrite_side/auto_rewrite';
import AutoCreateSide from './auto_create.js/auto_create';

export default function Layout( {project_id, project_name, performers_list_props} ) {
    const [script, setScript] = useState([]);
    const [projectName, setProjectName] = useState(project_name);
    const [newScript, setNewScript] = useState([]); //　書き換え後の台本を保持する
    const [scriptsObj, setScriptsObj] = useState({});
    const [speaker_list, setSpeakerList] = useState(new Map());
    const [selectedSpeaker, setSelectedSpeaker] = useState(null); // 編集中、選択されたスピーカーを保持する
    const [speakerSelectTrigger, setSpeakerSelectTrigger] = useState(0); // 同じスピーカーを連続選択したときも useEffect を発火させる用
    const [current_position, setCurrentPosition] = useState(0); // globalIdx
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [cueCardMode, setCueCardMode] = useState(true); // True: カンペモード, False: ナレーションモード。切り替わるたびにPresenter側の表示を変える.
    const [prompterMode, setPrompterMode] = useState(false);
    const [groupId, setGroupId] = useState([]); // 選択中・編集中のグループを保持する
    const [sentence_idx_max, setSentenceIdxMax] = useState(script.length - 1);
    const [activePanel, setActivePanel] = useState(null); // 'rewrite', or null
    const [editPermission, setEditPermission] = useState({}); // 編集権限リスト

    // 最新のデータを保持するための Ref
    const yjsInstanceRef = useRef(null);

    const id2Index = (id) => {
        let globalIndex = 0;
        for (let group of script) {
            for (let line of group) {
                if (line.id === id) {
                    return globalIndex;
                }
                globalIndex++;
            }
        }
        return null;
    }

    const updateProjectName = async () => {
        try{
            const res = await fetch('/api/supabase/update', {
                method: 'POST',
                body: JSON.stringify({ table: 'Project', data: { id: project_id, name: projectName } }),
            });
            const data = await res.json();
            if(data.error){
                console.error("Failed to update project name", data.error);
                return;
            }
        } catch (error) {
            console.error("Failed to update project name", error);
        }
    }

    useEffect( ()=>{
        async function pusherSyncRequestEvent(){
            // シングルトン的に扱うためにrefで保持
            if (!yjsInstanceRef.current) {
                yjsInstanceRef.current = new YjsInstance(project_id);
            }
            const yjsInstance = yjsInstanceRef.current;
            console.log("yjsInstance is initialized: ", yjsInstance);
            const channel = pusherClient
                .subscribe(`private-yjs-update-${project_id}`)
                .bind(`evt::yjs-update-${project_id}`, async (data) => {
                    try {
                        const update = data.update;
                        const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
                        const updateUint8 = new Uint8Array(updateArray);
                        
                        // remote update適用
                        await yjsInstance.remoteUpdateHandler(updateUint8);

                        // State更新
                        if (yjsInstance.getPrompterMode() !== undefined) setPrompterMode(yjsInstance.getPrompterMode());
                        if (yjsInstance.getCueCardMode() !== undefined) setCueCardMode(yjsInstance.getCueCardMode());
                        if (yjsInstance.getCurrentPosition() !== undefined) setCurrentPosition(yjsInstance.getCurrentPosition());
                        if (yjsInstance.getScript() !== undefined) setScript(yjsInstance.getScript());
                        if (yjsInstance.getSpeaker() !== undefined) setSpeakerList(new Map(Object.entries(yjsInstance.getSpeaker()))); // 要修正

                    } catch (e) {
                        console.error("Error applying update", e);
                    }
                });
            return () => {
                if (channel) channel.unbind();
                if (yjsInstanceRef.current) {
                    yjsInstanceRef.current.destroy();
                    yjsInstanceRef.current = null;
                }
            };
        }

        async function yjsSetting(){
            try{
                if (!yjsInstanceRef.current) {
                    yjsInstanceRef.current = new YjsInstance(project_id);
                }
                const yjsInstance = yjsInstanceRef.current;
                await yjsInstance.sync();

                if (yjsInstance.getCueCardMode() !== undefined) setCueCardMode(yjsInstance.getCueCardMode());
                if (yjsInstance.getPrompterMode() !== undefined) setPrompterMode(yjsInstance.getPrompterMode());
                if (yjsInstance.getCurrentPosition() !== undefined) setCurrentPosition(yjsInstance.getCurrentPosition());
                if (yjsInstance.getScript() !== undefined) setScript(yjsInstance.getScript());
                if (yjsInstance.getSpeaker() !== undefined) setSpeakerList(new Map(Object.entries(yjsInstance.getSpeaker())));
            }catch(e){
                console.error("Failed to set yjs", e);
            }
        }

        async function pusherUpslashLockEvent(){
            const channel = pusherClient
                .subscribe(`private-upstash-lock-${project_id}`)
                .bind(`evt::lock-${project_id}`, (data) => {
                    setEditPermission(prev => {
                        const newEditPermission = {...prev};
                        data.scriptIds.forEach(scriptId => {
                            newEditPermission[scriptId] = data.userId;
                        });
                        return newEditPermission;
                    });
                });
            return () => {
                channel.unbind();
            };
        }

        async function pusherUpslashUnlockEvent(){
            const channel = pusherClient
                .subscribe(`private-upstash-unlock-${project_id}`)
                .bind(`evt::unlock-${project_id}`, (data) => {
                    setEditPermission(prev => {
                        const newEditPermission = {...prev};
                        data.scriptIds.forEach(scriptId => {
                            delete newEditPermission[scriptId];
                        });
                        return newEditPermission;
                    });
                });
            return () => {
                channel.unbind();
            };
        }

        async function getUpstashEditPermission(){
            const res = await fetch('/api/edit_lock/get_permission_list', {
                method: 'GET',
            });
            const data = await res.json();
            setEditPermission(data.permission_list.reduce((acc, cur) => {
                acc[cur.scriptId] = cur.userId;
                return acc;
            }, {}));
        }


        yjsSetting();
        pusherSyncRequestEvent();
        pusherUpslashLockEvent();
        pusherUpslashUnlockEvent();
        getUpstashEditPermission();

        const LOCK_POLL_INTERVAL_MS = 25 * 1000; // 編集権限リスト取得の間隔
        const lockPollId = setInterval(getUpstashEditPermission, LOCK_POLL_INTERVAL_MS);
        return () => clearInterval(lockPollId);
    },[]);



    // 音声認識用にscripts配列をオブジェクトに変換する {0: "...", 1: "...", ...}
    useEffect(() => {
        const flatScript = script.flat();
        setScriptsObj(() => {return flatScript.reduce((acc, cur, idx) => {
            acc[idx] = {id: cur.id, text: cur.text.replace(/\|/g, "")};
            // acc[idx] = cur.text.replace(/\|/g, "");
            return acc;
        }, {})});
    }, [script]);



    return (
        <div className="flex h-screen flex-col">
            <Header project_id={project_id}/>
            <textarea className="w-fit h-10 text-xl font-semibold text-slate-900"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter'){
                    e.preventDefault();
                    updateProjectName();
                }
            }}
            />
            <div className="flex flex-1 min-h-0 py-4 px-2 space-x-2">
            {/* 台本編集パネル */}            
            <div className="flex-[6] min-w-0">
                <ScriptSide project_id={project_id} script={script} setScript={setScript} newScript={newScript} setNewScript={setNewScript} speaker_list={speaker_list} setSpeakerList={setSpeakerList} 
                current_position={current_position} setCurrentPosition={setCurrentPosition} selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} speakerSelectTrigger={speakerSelectTrigger}
                groupId={groupId} setGroupId={setGroupId} yjsInstance={yjsInstanceRef.current} editPermission={editPermission} setEditPermission={setEditPermission}
                />
            </div>

            {/* 操作パネル */}
            <div className="flex-[4] min-w-0">
                <ControlSide project_id={project_id} script={script} setScript={setScript} cueCardMord={cueCardMode} setCueCardMord={setCueCardMode} prompterMode={prompterMode} setPrompterMode={setPrompterMode} 
                isRecognizing={isRecognizing} setIsRecognizing={setIsRecognizing} current_position={current_position} setCurrentPosition={setCurrentPosition} 
                sentence_idx_max={sentence_idx_max} selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} onSpeakerListSelect={(speaker) => { setSelectedSpeaker(speaker); setSpeakerSelectTrigger((t) => t + 1); }} groupId={groupId} setGroupId={setGroupId} 
                performers_list={performers_list_props} yjsInstance={yjsInstanceRef.current} />
            </div>

            {/* スライドインパネルボタン群 */}
            <div className={`fixed top-1/2 transform -translate-y-1/2 flex flex-col items-end z-50 transition-all duration-300 space-y-2 ${activePanel ? 'right-96' : 'right-0'}`}>

                {/* AI自動書き換えパネルボタン */}                
                <button 
                    onClick={() => setActivePanel(activePanel === 'audio_rewrite' ? null : 'audio_rewrite')}
                    className={`flex items-center justify-center w-12 h-12 bg-white text-gray-400 hover:text-blue-600 border border-gray-200 rounded-l-md shadow-md transition-colors ${activePanel === 'audio_rewrite' ? 'text-blue-600 bg-blue-50' : ''}`}
                    aria-label="Toggle Audio Rewrite Panel"
                    title="AI自動書き換え"
                >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                </button>
                {/* 新規作成パネルボタン */}
                <button 
                    onClick={() => setActivePanel(activePanel === 'new_script' ? null : 'new_script')}
                    className={`flex items-center justify-center w-12 h-12 bg-white text-gray-400 hover:text-blue-600 border border-gray-200 rounded-l-md shadow-md transition-colors ${activePanel === 'new_script' ? 'text-blue-600 bg-blue-50' : ''}`}
                    aria-label="Toggle New Script Panel"
                    title="新規作成"
                >
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* スライドインパネル */}
            <div 
                className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
                    activePanel ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="h-full flex flex-col p-4 bg-gray-50 border-l border-gray-200">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-gray-700">
                            {activePanel === 'audio_rewrite' ? 'AI自動書き換え' : activePanel === 'new_script' ? '新規作成' : ''}
                        </h2>
                        <button 
                            onClick={() => setActivePanel(null)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {activePanel === 'audio_rewrite' && (
                            <AutoRewriteSide script={scriptsObj} setNewScript={setNewScript} current_position={current_position} />
                        )}
                        {activePanel === 'new_script' && (
                            <AutoCreateSide script={scriptsObj} setScript={setScript} setNewScript={setNewScript} />
                        )}
                    </div>
                </div>
            </div>

            </div>
        </div>
    )
}