"use client"

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/utils/pusher/client';
import { YjsInstance } from '@/app/utils/yjs/client';
import ScriptSide from './script_side';
import ControlSide from './control_side';
import SpeechSide from './speech_side';
import TemplateSide from './template_side/template_list';
import Canvas from './template_side/canvas';

export default function Layout( {scripts, speakers, performers_list} ) {
    const [script, setScript] = useState(scripts);
    const [speaker_list, setSpeakerList] = useState(speakers);
    const [selectedSpeaker, setSelectedSpeaker] = useState(null); // 編集中、選択されたスピーカーを保持する
    const [scriptsObj, setScriptsObj] = useState({});
    const [speechHistory, setSpeechHistory] = useState([]);
    const [current_position, setCurrentPosition] = useState(0); // globalIdx
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [cueCardMode, setCueCardMode] = useState(true); // True: カンペモード, False: ナレーションモード。切り替わるたびにPresenter側の表示を変える.
    const [prompterMode, setPrompterMode] = useState(false);
    const [groupIndex, setGroupIndex] = useState([]); // 選択中・編集中のグループを保持する
    const [sentence_idx_max, setSentenceIdxMax] = useState(scripts.length - 1);
    const [activePanel, setActivePanel] = useState(null); // 'speech', 'cue_list', or null
    const [isHandwriteModalOpen, setIsHandwriteModalOpen] = useState(false); // モーダル表示用State
    // 最新のデータを保持するための Ref
    const latestDataRef = useRef(null); // 削除予定
    const yjsInstanceRef = useRef(null);

    // // Stateが更新されるたびに Ref の中身を最新にする
    // useEffect(() => {
    //     latestDataRef.current = { 
    //         script: script, 
    //         speaker_list: speaker_list, 
    //         position: current_position, 
    //         cueCardMode: cueCardMord, 
    //         prompterMode: prompterMode 
    //     };
    // }, [script, speaker_list, current_position, cueCardMord, prompterMode]);

    async function snapshot() {
        await fetch('/api/yjs/snapshot', {
            method: 'POST',
        });
    }

    const syncData = null;
    // const syncData = async () => {
    //     // Ref から最新の値を取得 (初回などで Ref が null の場合は state を使うフォールバックを入れています)
    //     const body = latestDataRef.current || { script, speaker_list, position: current_position, cueCardMode: cueCardMord, prompterMode: prompterMode };
        
    //     console.log("sync data: ", body);
    //     const res_sync = await fetch('/api/pusher/sync/acc', {
    //         method: 'POST',
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify(body),
    //     });
    //     const data_sync = await res_sync.json();
    //     console.log("sync event が送信されました:", data_sync);
    // }

    useEffect( ()=>{
        async function pusherSyncRequestEvent(){
            // シングルトン的に扱うためにrefで保持
            if (!yjsInstanceRef.current) {
                yjsInstanceRef.current = new YjsInstance();
            }
            const yjsInstance = yjsInstanceRef.current;
            
            const channel = pusherClient
                .subscribe("private-yjs-update")
                .bind("evt::yjs-update", async (data) => {
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
                        if (yjsInstance.getSpeaker() !== undefined) setSpeakerList(yjsInstance.getSpeaker()); // 要修正

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
                    yjsInstanceRef.current = new YjsInstance();
                }
                const yjsInstance = yjsInstanceRef.current;
                await yjsInstance.sync();

                if (yjsInstance.getCueCardMode() !== undefined) setCueCardMode(yjsInstance.getCueCardMode());
                if (yjsInstance.getPrompterMode() !== undefined) setPrompterMode(yjsInstance.getPrompterMode());
                if (yjsInstance.getCurrentPosition() !== undefined) setCurrentPosition(yjsInstance.getCurrentPosition());
                if (yjsInstance.getScript() !== undefined) setScript(yjsInstance.getScript());

                if (yjsInstance.getSpeaker() !== undefined) setSpeakerList(yjsInstance.getSpeaker());
            }catch(e){
                console.error("Failed to set yjs", e);
            }
        }
        yjsSetting();
        pusherSyncRequestEvent();
    },[]);

    // 【AIリアルタイム編集機能】
    // ここで、Scriptの重要度を設定する.
    // 「リアルタイム編集ON/OFFボタン」がONになったら、ポップアップを展開する.
    // ポップアップで、Scriptの重要度を設定する.
    // 重要度を設定すると，scriptの配列(object)を更新する.
    // 編集は，Current_Position以降のみにすることで、Indexずれが起こらない。
    // 編集のタイミングは、始まる前(Index = 0)，1/3，2/3，のタイミングで行う。
    // 書き換えにかかる時間に応じて、編集のタイミングを前倒しする。

    // 音声認識用にscripts配列をオブジェクトに変換する {0: "...", 1: "...", ...}
    useEffect(() => {
        const flatScript = script.flat();
        setScriptsObj(() => {return flatScript.reduce((acc, cur, idx) => {
            acc[idx] = cur;
            return acc;
        }, {})});
    }, [script]);

    useEffect(()=>{ // カンペモードになった場合、音声認識を強制終了する
        if (cueCardMode) {
            setIsRecognizing(false);
        }
    }, [cueCardMode])

    useEffect(()=>{ // 位置更新イベントを送信する。
        async function updatePosition() { 
            if (yjsInstanceRef.current.getCurrentPosition() !== current_position) {
                yjsInstanceRef.current.setCurrentPosition(current_position);
            }
        }
        async function updateSpeechHistory() {
            if (speechHistory.includes(scriptsObj[current_position])) {
                return;
            }else{
                setSpeechHistory(prev => [...prev, scriptsObj[current_position]]);
            }
        }
        updatePosition();
        updateSpeechHistory();
    }, [current_position])

    return (
        <div className="flex h-screen py-4 px-2 space-x-2">
            {/* 台本編集パネル */}
            <div className="flex-[6] min-w-0">
                <ScriptSide script={script} setScript={setScript} speaker_list={speaker_list} setSpeakerList={setSpeakerList} 
                current_position={current_position} setCurrentPosition={setCurrentPosition} selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} 
                groupIndex={groupIndex} setGroupIndex={setGroupIndex} syncData={syncData} yjsInstance={yjsInstanceRef.current} />
            </div>

            {/* 操作パネル */}
            <div className="flex-[4] min-w-0">
                <ControlSide script={script} setScript={setScript} cueCardMord={cueCardMode} setCueCardMord={setCueCardMode} prompterMode={prompterMode} setPrompterMode={setPrompterMode} 
                isRecognizing={isRecognizing} setIsRecognizing={setIsRecognizing} current_position={current_position} setCurrentPosition={setCurrentPosition} 
                sentence_idx_max={sentence_idx_max} selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} groupIndex={groupIndex} setGroupIndex={setGroupIndex} 
                performers_list={performers_list} yjsInstance={yjsInstanceRef.current} />
            </div>


            {/* スライドインパネルボタン群 */}
            <div className={`fixed top-1/2 transform -translate-y-1/2 flex flex-col items-end z-50 transition-all duration-300 space-y-2 ${activePanel ? 'right-96' : 'right-0'}`}>
                
                {/* 音声認識パネルボタン */}
                <button 
                    onClick={() => setActivePanel(activePanel === 'speech' ? null : 'speech')}
                    className={`flex items-center justify-center w-12 h-12 bg-white text-gray-400 hover:text-blue-600 border border-gray-200 rounded-l-md shadow-md transition-colors ${activePanel === 'speech' ? 'text-blue-600 bg-blue-50' : ''}`}
                    aria-label="Toggle Speech Panel"
                    title="音声認識"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>

                {/* 定型カンペリストパネルボタン */}
                <button 
                    onClick={() => setActivePanel(activePanel === 'cue_list' ? null : 'cue_list')}
                    className={`flex items-center justify-center w-12 h-12 bg-white text-gray-400 hover:text-blue-600 border border-gray-200 rounded-l-md shadow-md transition-colors ${activePanel === 'cue_list' ? 'text-blue-600 bg-blue-50' : ''}`}
                    aria-label="Toggle Cue List Panel"
                    title="定型カンペリスト"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                            {activePanel === 'speech' ? '自動音声認識' : '定型カンペリスト'}
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
                        {activePanel === 'speech' && (
                            <SpeechSide script={scriptsObj} speechHistory={speechHistory} setSpeechHistory={setSpeechHistory} isRecognizing={isRecognizing} setIsRecognizing={setIsRecognizing} current_position={current_position} setCurrentPosition={setCurrentPosition} sentence_idx_max={sentence_idx_max} />
                        )}
                        {activePanel === 'cue_list' && (
                            <TemplateSide onOpenHandwrite={() => setIsHandwriteModalOpen(true)} />
                        )}
                    </div>
                </div>
            </div>

            {/* 手書き入力モーダル */}
            {isHandwriteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-[90vw] h-[80vh] relative flex flex-col">
                        {/* 閉じるボタン */}
                        <button 
                            onClick={() => setIsHandwriteModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <h2 className="text-xl font-bold mb-4 text-gray-700">手書きカンペ入力</h2>
                        
                        <div className="p-4 h-full w-full">
                            <Canvas />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}