"use client"

import { useState, useEffect, useRef } from 'react';
import Prompter from './script_side_utils/prompter';
import CueCard from './script_side_utils/cue_card';
import { pusherClient } from '@/app/utils/pusher/client';
import { YjsInstance } from '@/app/utils/yjs/client';

export default function Layout( {scripts, speakers, performers_list} ) {
    const [script, setScript] = useState(scripts);
    const [speaker_list, setSpeakerList] = useState(speakers);
    const [current_position, setCurrentPosition] = useState(0); // globalIdx
    const [cueCardMode, setCueCardMode] = useState(true); // True: カンペモード, False: ナレーションモード。切り替わるたびにPresenter側の表示を変える.
    const [prompterMode, setPrompterMode] = useState(false);
    const [cueCard, setCueCard] = useState("");
    const [showCueCard, setShowCueCard] = useState(false);
    const [handwriteCueCard, setHandwriteCueCard] = useState("");
    const [showHandwriteCueCard, setShowHandwriteCueCard] = useState(false);
    const yjsInstanceRef = useRef(null);

    // cueCard更新時のエフェクト
    useEffect(() => {
        if (cueCard === "") return;
        if (cueCard) {
            setShowCueCard(true);
            const timer = setTimeout(() => {
                setShowCueCard(false);
                setCueCard("");
            }, 3000); // 3秒後に非表示
            return () => clearTimeout(timer);
        }
    }, [cueCard]);

    useEffect(() => {
        if (handwriteCueCard === "") return;
        if (handwriteCueCard) {
            setShowHandwriteCueCard(true);
            const timer = setTimeout(() => {
                setShowHandwriteCueCard(false);
                setHandwriteCueCard("");
            }, 3000); // 3秒後に非表示
            return () => clearTimeout(timer);
        }
    }, [handwriteCueCard]);

    useEffect(() => {
        // YJSインスタンスを設定する。
        async function yjsSetting(){
            try{
                if (!yjsInstanceRef.current) {
                    yjsInstanceRef.current = new YjsInstance();
                }
                const yjsInstance = yjsInstanceRef.current;
                await yjsInstance.sync(); // DBとの同期処理
                if (yjsInstance.getCueCardMode() !== undefined) setCueCardMode(yjsInstance.getCueCardMode());
                if (yjsInstance.getPrompterMode() !== undefined) setPrompterMode(yjsInstance.getPrompterMode());
                if (yjsInstance.getCurrentPosition() !== undefined) setCurrentPosition(yjsInstance.getCurrentPosition());
                if (yjsInstance.getScript() !== undefined) setScript(yjsInstance.getScript());
                if (yjsInstance.getSpeaker() !== undefined) setSpeakerList(yjsInstance.getSpeaker());
            }catch(e){
                console.error("Failed to set yjs", e);
            }
        }

        // Pusherのyjsの更新イベントを受信する。
        async function pusherYjsUpdateEvent(){
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

        // Pusherの位置更新イベントを受信する。
        function pusherPositionUpdateEvent() { 
            const channel = pusherClient
                .subscribe("private-position-update")
                .bind("evt::position-update", (data) => {
                    setCurrentPosition(data.position);
                });
            return () => {
                channel.unbind();
            };
        }

        // Pusherの同期イベントを受信する。
        function pusherSyncEvent() {
            const channel = pusherClient
                .subscribe("private-sync")
                .bind("evt::sync", (data) => {
                    setScript(data.script);
                    data.speaker_list? setSpeakerList(data.speaker_list) : null;
                    setCurrentPosition(data.position);
                    setCueCardMode(data.cueCardMode);
                    setPrompterMode(data.prompterMode);
                });
            return () => {
                channel.unbind();
            };
        }

        // Pusherの初期化時の同期イベントを送信する。
        async function pusherSyncRequestEvent(){
            const res_sync_request = await fetch('/api/pusher/sync/req');
            const data_sync_request = await res_sync_request.json();
        }

        // Pusherのモード切り替えイベントを受信する。
        function pusherModeChangeEvent() { 
            const channel = pusherClient
                .subscribe("private-mode-switch")
                .bind("evt::mode-switch", (data) => {
                    setCueCardMode(data.mode);
                });
            return () => {
                channel.unbind();
            };
        }

        // Pusherの台本更新イベントを受信する。
        function pusherUpdateScriptEvent() {
            const channel = pusherClient
                .subscribe("private-update-script")
                .bind("evt::update-script", (data) => {
                    setScript(data.script);
                    data.speaker_list? setSpeakerList(data.speaker_list) : null;
                });
            return () => {
                channel.unbind();
            };
        }
        
        // Pusherの編集イベントを受信する。
        function pusherEditingEvent() { 
            const channel = pusherClient
                .subscribe("private-editing")
                .bind("evt::editing", (data) => {
                    if (data.text === "") { // 更新内容が行削除の場合
                        setScript(prevScript => {
                            const new_script = [...prevScript];
                            if(new_script[data.groupIdx].length > 1){
                                new_script[data.groupIdx].splice(data.localIdx, 1);
                            }else{
                                new_script.splice(data.groupIdx, 1);
                            }
                            return new_script;
                        });
                        setSpeakerList(prevSpeakerList => {
                            const new_speakerList = [...prevSpeakerList];
                            new_speakerList.splice(data.globalIdx, 1);
                            return new_speakerList;
                        });
                    }else{
                        setScript(prevScript => {
                            const new_script = [...prevScript];
                            new_script[data.groupIdx][data.localIdx] = data.text;
                            return new_script;
                        });
                        setSpeakerList(prevSpeakerList => {
                            const new_speakerList = [...prevSpeakerList];
                            new_speakerList[data.globalIdx] = data.speaker;
                            return new_speakerList;
                        });
                    }

                });
            return () => {
            channel.unbind();
            };
        }

        // Pusherの行挿入イベントを受信する。
        function pusherInsertingEvent() {
            const channel = pusherClient
                .subscribe("private-inserting")
                .bind("evt::inserting", (data) => {
                    console.log("data", data);
                    setScript(prevScript => {
                        const newScript = [...prevScript];
                        let currentIndex = 0;
                        for(let i = 0; i < newScript.length; i++){
                            let temp = [...newScript[i]];
                            if(currentIndex <= data.globalIdx && currentIndex + newScript[i].length > data.globalIdx){
                                temp.splice(data.globalIdx - currentIndex, 0, data.text);
                                newScript[i] = temp;
                                break;
                            }
                            else if(currentIndex + newScript[i].length === data.globalIdx){
                                newScript.splice(i + 1, 0, [data.text]);
                                break;
                            }
                            currentIndex += newScript[i].length;
                        }
                        return newScript;
                    });
                    setSpeakerList(prevSpeakerList => {
                        const new_speakerList = [...prevSpeakerList];
                        new_speakerList.splice(data.globalIdx, 0, data.speaker);
                        return new_speakerList;
                    });
                });
            return () => {
                channel.unbind();
            };
        }

        // Pusherのスピーカー更新イベントを受信する。
        function pusherUpdateSpeakerEvent() {
            const channel = pusherClient
                .subscribe("private-update-speaker")
                .bind("evt::update-speaker", (data) => {
                    setSpeakerList(prevSpeakerList => {
                        const new_speakerList = [...prevSpeakerList];
                        new_speakerList[data.globalIdx] = data.speaker;
                        return new_speakerList;
                    });
                });
            return () => {
                channel.unbind();
            };
        }

        // プロンプターモード切り替えイベントを受信する。
        function pusherPrompterSwitchEvent() {
            const channel = pusherClient
                .subscribe("private-prompter-switch")
                .bind("evt::prompter-switch", (data) => {
                    setPrompterMode(data.mode);
                });
            return () => {
                channel.unbind();
            };
        };

        // Pusherの定型カンペ送信イベントを受信する。
        function pusherCueCardTemplateEvent() {
            const channel = pusherClient
                .subscribe("private-cue-card-template")
                .bind("evt::cue-card-template", (data) => {
                    setCueCard(data.content);
                });
            return () => {
                channel.unbind();
            };
        }

        function pusherHandwriteCueCardEvent() {
            const channel = pusherClient
                .subscribe("private-handwrite-cue-card")
                .bind("evt::handwrite-cue-card", (data) => {
                    setHandwriteCueCard(data.cueCard);
                });
            return () => {
                channel.unbind();
            };
        }


        yjsSetting();
        pusherYjsUpdateEvent();

        pusherCueCardTemplateEvent();
        pusherHandwriteCueCardEvent();

        // pusherPositionUpdateEvent();
        // pusherSyncEvent();
        // pusherModeChangeEvent();
        // pusherUpdateScriptEvent();
        // pusherEditingEvent();
        // pusherInsertingEvent();
        // pusherUpdateSpeakerEvent();
        // pusherPrompterSwitchEvent();
        // pusherSyncRequestEvent(); // 最後に実行
    }, []);

    


    return (
        <div className="flex h-screen py-4 px-2 space-x-2 relative overflow-hidden">
            <div className="flex-1 min-w-0 transition-all duration-300">
            {cueCardMode ? (
                    <div className="h-full flex flex-col">
                        <div>カンペモード</div>
                        <div className="flex-1 min-h-0">
                            <CueCard script={script} speaker_list={speaker_list} current_position={current_position} performers_list={performers_list} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div>ナレーションモード</div>
                        <div className="flex-1 min-h-0">
                            <Prompter script={script} speaker_list={speaker_list} current_position={current_position} prompterMode={prompterMode} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* 定型カンペのオーバーレイ表示 */}
            {showCueCard && (
                <div className="absolute bottom-12 right-12 z-50 pointer-events-none">
                    <div className="bg-gray-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-sm  max-w-2xl w-[25vw] h-[30vh] mx-4 animate-in fade-in zoom-in duration-300">
                        <div 
                            className="bg-white p-2 rounded-lg w-full h-full flex items-center justify-center" // flex等を追加して中央寄せ
                            style={{ containerType: 'size' }} // ★ここが重要：コンテナクエリを有効化
                        >
                            <p 
                                className="text-black font-bold text-center leading-relaxed whitespace-pre-wrap break-words drop-shadow-md w-full"
                                style={{
                                    fontSize: `${Math.min(30, 30 / Math.sqrt(Math.max(1, cueCard.length)))}cqw`
                                }}// ★ここが重要：コンテナ幅の15%のサイズにする
                            >
                                {cueCard}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* 手書きカンペのオーバーレイ表示 */}
            {showHandwriteCueCard && (
                <div className="absolute bottom-12 right-12 z-50 pointer-events-none">
                    <div className="bg-gray-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-sm w-[25vw] h-[30vh] animate-in fade-in zoom-in duration-300">
                        <img src={handwriteCueCard} alt="Handwrite Cue Card" className="w-full h-full object-contain" />
                    </div>
                </div>
            )}
        </div>
    )

}