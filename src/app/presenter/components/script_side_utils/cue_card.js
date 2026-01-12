"use client"

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/utils/pusher/client';

// 行ごとにサイズを自動調整するコンポーネント
const AutoSizedText = ({ text }) => {
    const containerRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        const resize = () => {
            const container = containerRef.current;
            const textEl = textRef.current;
            if (!container || !textEl) return;

            // 計測用に一時的に設定
            textEl.style.fontSize = '100px';
            textEl.style.whiteSpace = 'nowrap';
            
            const containerWidth = container.clientWidth;
            const textWidth = textEl.scrollWidth;

            if (textWidth > 0) {
                // コンテナ幅に収まるフォントサイズを計算
                // 余白を含めて少し小さめにする (0.95倍)
                let newSize = (containerWidth / textWidth) * 100 * 0.95;
                // 最大サイズ制限
                newSize = Math.min(newSize, 200); 
                textEl.style.fontSize = `${newSize}px`;
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [text]);

    return (
        <div ref={containerRef} className="w-full flex justify-center overflow-hidden">
            <span ref={textRef} className="font-bold leading-tight transition-all duration-200 text-gray-800">
                {text}
            </span>
        </div>
    );
};

export default function CueCard( {script, setScript, current_position} ) {

    // 初期化時
    useEffect(() => {
        // Pusherの編集イベントを受信する。
        function pusherEditingEvent() { 
            const channel = pusherClient
                .subscribe("private-editing")
                .bind("evt::editing", (data) => {
                    if (data.text === "") { // 更新内容が行削除の場合
                        setScript(prevScript => {
                            const new_script = [...prevScript];
                            new_script.splice(data.index, 1);
                            return new_script;
                        });
                    }else{
                        setScript(prevScript => {
                            console.log("data.text", data.text);
                            const new_script = [...prevScript];
                            new_script[data.index] = data.text;
                            return new_script;
                        });
                    }

                });
            console.log("channel", channel);
            return () => {
            channel.unbind();
            };
        }

        // Pusherの行挿入イベントを受信する。
        function pusherInsertingEvent() {
            const channel = pusherClient
                .subscribe("private-inserting")
                .bind("evt::inserting", (data) => {
                    setScript(prevScript => {
                        const new_script = [...prevScript];
                        new_script.splice(data.index, 0, data.text);
                        return new_script;
                    });
                });
            return () => {
                channel.unbind();
            };
        }

        pusherEditingEvent(); // Pusherの編集イベントを受信する。
        pusherInsertingEvent(); // Pusherの行挿入イベントを受信する。
    }, []);

    useEffect(() => {
        
    }, [current_position]);

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <div>current_position: {current_position}</div>
                    <h2 className="text-xl font-semibold text-gray-700">台本パネル</h2>
                </div>
            </div>
            <div 
                    className="bg-white border-2 border-gray-200 rounded-lg flex-1 overflow-y-auto p-4 space-y-1"
                    style={{ maxHeight: '85vh' }}
                >
                    {script.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            台本が読み込まれていません
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-full w-full py-4 space-y-2">
                            {script[current_position] && script[current_position].split('|').map((line, index) => (
                                <AutoSizedText key={index} text={line} />
                            ))}
                        </div>
                    )}
                </div>
        </div>
    )
}