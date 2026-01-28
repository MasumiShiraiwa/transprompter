"use client"

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/utils/pusher/client';

export default function Prompter( {script, speaker_list, current_position, prompterMode} ) {
    const scrollRef = useRef(null);
    // const [prompterMode, setPrompterMode] = useState(false);

    // 現在位置が変更されたときに自動スクロール
    // スムーズスクロールのスピードを独自調整するために scrollIntoView を使わずに animate scroll を利用
    useEffect(() => {
        // カスタムスクロール速度調整（ミリ秒）
        const DURATION = 750; // ← ここを増減させるとスピードが変化（ms）
        if (scrollRef.current && current_position !== undefined) {
            const container = scrollRef.current;
            const currentElement = container.children[current_position + 2];
            if (currentElement) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = currentElement.getBoundingClientRect();
                // 中央に合わせたいので、以下でスクロール先を計算
                const elementCenter = elementRect.top + elementRect.height / 2;
                const containerCenter = containerRect.top + containerRect.height / 2;
                const scrollOffset = elementCenter - containerCenter;

                // スクロールの目標位置
                const targetScrollTop = container.scrollTop + scrollOffset;

                const startTime = performance.now();
                const startScrollTop = container.scrollTop;

                function animateScroll(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / DURATION, 1);

                    // イージング（easeInOutQuad）
                    const ease = progress < 0.5
                        ? 2 * progress * progress
                        : -1 + (4 - 2 * progress) * progress;

                    container.scrollTop = startScrollTop + (targetScrollTop - startScrollTop) * ease;

                    if (progress < 1) {
                        window.requestAnimationFrame(animateScroll);
                    }
                }

                window.requestAnimationFrame(animateScroll);
            }
        }
    }, [current_position]);


    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700">台本パネル</h2>
                </div>
            </div>
            <div 
                ref={scrollRef}
                className="bg-white border-2 border-gray-200 rounded-lg flex-1 overflow-y-auto p-4 px-32 space-y-1"
                style={{ maxHeight: '85vh' }}
            >
                {script.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        台本が読み込まれていません
                    </div>
                ) : (
                    script.flat().map((line, index) => (
                        console.log("line", line),
                        <p 
                            key={index}
                            className={`py-2 leading-relaxed transition-colors duration-200 font-bold whitespace-pre-line text-2xl text-center`}
                        >
                            {prompterMode ? (
                                <>
                                    {/* <span className="text-3xl text-gray-500 mr-4 inline-block" style={{ transform: 'scaleX(-1)' }}>
                                        {index + 1}.
                                    </span> */}
                                    <span className="inline-block" style={{ transform: 'scaleX(-1)' }}>
                                        <span className="text-xl text-gray-500 mr-4">
                                            {speaker_list[index]}
                                        </span>
                                        {line.replace(/\|/g, "\n")}
                                    </span>

                                </>
                            ) : (
                                <>
                                    <span className="text-xl text-gray-500 mr-4">
                                        {speaker_list[index]}
                                    </span>
                                    {line.replace(/\|/g, "\n")}
                                </>
                            )}
                        </p>
                    ))
                )}
            </div>
        </div>
    )
}