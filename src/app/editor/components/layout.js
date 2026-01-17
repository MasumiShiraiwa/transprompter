"use client"

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/utils/pusher/client';
import ScriptSide from './script_side';
import SpeechSide from './speech_side';
import ControlSide from './control_side';


export default function Layout( {scripts, speakers, performers_list} ) {
    const [script, setScript] = useState(scripts);
    const [speaker_list, setSpeakerList] = useState(speakers);
    const [selectedSpeaker, setSelectedSpeaker] = useState(null); // 編集中、選択されたスピーカーを保持する
    const [scriptsObj, setScriptsObj] = useState({});
    const [current_position, setCurrentPosition] = useState(0); // globalIdx
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [cueCardMord, setCueCardMord] = useState(true); // True: カンペモード, False: ナレーションモード。切り替わるたびにPresenter側の表示を変える.
    const [prompterMode, setPrompterMode] = useState(false);
    const [groupIndex, setGroupIndex] = useState([]);
    const [sentence_idx_max, setSentenceIdxMax] = useState(scripts.length - 1);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    // 最新のデータを保持するための Ref
    const latestDataRef = useRef(null);

    // Stateが更新されるたびに Ref の中身を最新にする
    useEffect(() => {
        latestDataRef.current = { 
            script: script, 
            speaker_list: speaker_list, 
            position: current_position, 
            cueCardMode: cueCardMord, 
            prompterMode: prompterMode 
        };
    }, [script, speaker_list, current_position, cueCardMord, prompterMode]);

    const syncData = async () => {
        // Ref から最新の値を取得 (初回などで Ref が null の場合は state を使うフォールバックを入れています)
        const body = latestDataRef.current || { script, speaker_list, position: current_position, cueCardMode: cueCardMord, prompterMode: prompterMode };
        
        console.log("sync data: ", body);
        const res_sync = await fetch('/api/pusher/sync/acc', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_sync = await res_sync.json();
        console.log("sync event が送信されました:", data_sync);
    }

    useEffect(()=>{
        async function pusherSyncRequestEvent(){
            const channel = pusherClient
                .subscribe("private-sync-request")
                .bind("evt::sync-request", async (data) => {
                    console.log("sync request event が送信されました:", data);
                    await syncData();
                });
            return () => {
                channel.unbind();
            };
        }
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

    // scripts配列をオブジェクトに変換する {0: "...", 1: "...", ...}
    useEffect(() => {
        const flatScript = script.flat();
        setScriptsObj(() => {return flatScript.reduce((acc, cur, idx) => {
            acc[idx] = cur;
            return acc;
        }, {})});
    }, [script]);

    useEffect(()=>{
        if (cueCardMord) { // カンペモードの場合、音声認識を強制終了する
            setIsRecognizing(false);
        }
    }, [cueCardMord])

    useEffect(()=>{
        async function updatePosition() { // 位置更新イベントを送信する。
            if(current_position === null)return;
            const res_update_pos = await fetch('/api/pusher/update_position', {
                method: 'POST',
                    body: JSON.stringify({ position: current_position }),
                });
                if(res_update_pos.status !== 200){
                    console.error("update position failed");
                    return;
                }
        }
        updatePosition();
    }, [current_position])

    return (
        <div className="flex h-screen py-4 px-2 space-x-2">
            {/* 台本編集パネル */}
            <div className="flex-[6] min-w-0">
                <ScriptSide script={script} setScript={setScript} speaker_list={speaker_list} setSpeakerList={setSpeakerList} 
                current_position={current_position} setCurrentPosition={setCurrentPosition} selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} 
                groupIndex={groupIndex} setGroupIndex={setGroupIndex} syncData={syncData} />
            </div>

            {/* 操作パネル */}
            <div className="flex-[4] min-w-0">
                <ControlSide script={script} setScript={setScript} cueCardMord={cueCardMord} setCueCardMord={setCueCardMord} prompterMode={prompterMode} setPrompterMode={setPrompterMode} 
                isRecognizing={isRecognizing} setIsRecognizing={setIsRecognizing} current_position={current_position} setCurrentPosition={setCurrentPosition} 
                sentence_idx_max={sentence_idx_max} selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} groupIndex={groupIndex} setGroupIndex={setGroupIndex} 
                performers_list={performers_list} />
            </div>


            {/* スライドインパネルボタン */}
            <button 
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className={`fixed top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-12 bg-white text-gray-400 hover:text-blue-600 hover:w-8 border-y border-l border-gray-200 rounded-l-md shadow-md z-50 transition-all duration-300 ${
                    isPanelOpen ? 'right-96' : 'right-0'
                }`}
                aria-label="Toggle Panel"
            >
                {isPanelOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                )}
            </button>

            {/* スライドインパネル */}
            <div 
                className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
                    isPanelOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="h-full flex flex-col p-4 bg-gray-50 border-l border-gray-200">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-gray-700">自動音声認識</h2>
                        <button 
                            onClick={() => setIsPanelOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <SpeechSide script={scriptsObj} isRecognizing={isRecognizing} setIsRecognizing={setIsRecognizing} current_position={current_position} setCurrentPosition={setCurrentPosition} sentence_idx_max={sentence_idx_max} />
                    </div>
                </div>
            </div>
        </div>
    )
}