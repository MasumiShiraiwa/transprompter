"use client"

import { useState, useEffect } from 'react';
import Prompter from './script_side_utils/prompter';
import CueCard from './script_side_utils/cue_card';
import { pusherClient } from '@/app/utils/pusher/client';

export default function Layout( {scripts} ) {
    const [script, setScript] = useState(scripts);
    const [scriptsObj, setScriptsObj] = useState({});
    const [current_position, setCurrentPosition] = useState(0);
    const [cueCardMord, setCueCardMord] = useState(true); // True: カンペモード, False: ナレーションモード。切り替わるたびにPresenter側の表示を変える.
    const [sentence_idx_max, setSentenceIdxMax] = useState(scripts.length - 1);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useEffect(() => {
        function pusherPositionUpdateEvent() { // 位置更新イベントを受信する。
            const channel = pusherClient
                .subscribe("private-position-update")
                .bind("evt::position-update", (data) => {
                    setCurrentPosition(data.position);
                });
            return () => {
                channel.unbind();
            };
        }

        function pusherModeChangeEvent() { // モード切り替えイベントを受信する。
            const channel = pusherClient
                .subscribe("private-mode-switch")
                .bind("evt::mode-switch", (data) => {
                    setCueCardMord(data.mode);
                });
            return () => {
                channel.unbind();
            };
        }

        pusherPositionUpdateEvent();
        pusherModeChangeEvent();
    }, []);


    return (
        <div className="flex h-screen py-4 px-2 space-x-2 relative overflow-hidden">
            <div className="flex-1 min-w-0 transition-all duration-300">
            {cueCardMord ? (
                    <div>
                        カンペモード
                        <CueCard script={script} setScript={setScript}  current_position={current_position} />
                    </div>
                ) : (
                    <div>
                        ナレーションモード
                        <Prompter script={script} setScript={setScript}  current_position={current_position} />
                    </div>
                )}
            </div>
            
        </div>
    )

}