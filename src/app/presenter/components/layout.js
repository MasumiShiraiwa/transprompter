"use client"

import { useState, useEffect, useRef } from 'react';
import Header from '@/app/utils/header';
import Prompter from './script_side_utils/prompter';
import CueCard from './script_side_utils/cue_card';
import { pusherClient } from '@/app/utils/pusher/client';
import { YjsInstance } from '@/app/utils/yjs/client';

export default function Layout( {project_id, performers_list} ) {
    const [script, setScript] = useState([]);
    const [speaker_list, setSpeakerList] = useState(new Map());
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
                    yjsInstanceRef.current = new YjsInstance(project_id);
                }
                const yjsInstance = yjsInstanceRef.current;
                await yjsInstance.sync(); // DBとの同期処理
                console.log("yjsInstance.sync is completed", yjsInstance);

                if (yjsInstance.getCueCardMode() !== undefined) setCueCardMode(yjsInstance.getCueCardMode());
                if (yjsInstance.getPrompterMode() !== undefined) setPrompterMode(yjsInstance.getPrompterMode());
                if (yjsInstance.getCurrentPosition() !== undefined) setCurrentPosition(yjsInstance.getCurrentPosition());
                if (yjsInstance.getScript() !== undefined) setScript(yjsInstance.getScript());
                if (yjsInstance.getSpeaker() !== undefined) setSpeakerList(new Map(Object.entries(yjsInstance.getSpeaker())));
            }catch(e){
                console.error("Failed to set yjs", e);
            }
        }

        // Pusherのyjsの更新イベントを受信する。
        async function pusherYjsUpdateEvent(){
            // シングルトン的に扱うためにrefで保持
            if (!yjsInstanceRef.current) {
                yjsInstanceRef.current = new YjsInstance(project_id);
            }
            const yjsInstance = yjsInstanceRef.current;
            
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

        // Pusherの定型カンペ送信イベントを受信する。
        function pusherCueCardTemplateEvent() {
            const channel = pusherClient
                .subscribe(`private-cue-card-template-${project_id}`)
                .bind(`evt::cue-card-template-${project_id}`, (data) => {
                    setCueCard(data.content);
                });
            return () => {
                channel.unbind();
            };
        }

        function pusherHandwriteCueCardEvent() {
            const channel = pusherClient
                .subscribe(`private-handwrite-cue-card-${project_id}`)
                .bind(`evt::handwrite-cue-card-${project_id}`, (data) => {
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
    }, []);

    


    return (
        <div className="flex h-screen flex-col">
            <Header project_id={project_id}/>
            <div className="flex flex-1 min-h-0 py-4 px-2 space-x-2 relative overflow-hidden">
            <div className="flex-1 min-w-0 transition-all duration-300">
            {cueCardMode ? (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 min-h-0">
                            <CueCard script={script} speaker_list={speaker_list} current_position={current_position} performers_list={performers_list} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 min-h-0">
                            <Prompter script={script} speaker_list={speaker_list} current_position={current_position} prompterMode={prompterMode} performers_list={performers_list} />
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
                                }}
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
        </div>
    )

}