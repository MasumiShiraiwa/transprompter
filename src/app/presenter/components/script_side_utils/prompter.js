"use client"

import { useState, useEffect, useRef } from 'react';

export default function Prompter( {script, speaker_list, current_position, prompterMode, performers_list} ) {
    const scrollRef = useRef(null);
    // const [prompterMode, setPrompterMode] = useState(false);

    const color_list = [
        "#2563eb", // blue-600
        "#f59e42", // orange-400
        "#059669", // emerald-600
        "#d946ef", // fuchsia-500
        "#e11d48", // rose-600
        "#7c3aed", // violet-600
        "#facc15", // yellow-400
        "#14b8a6", // teal-500
        "#db2777", // pink-600 
    ];

    const id2Index = (id) => {
        let globalIndex = 0;
        for(let group of script) {
            for(let line of group) {
                if(line.id === id) {
                    return globalIndex;
                }
                globalIndex++;
            }
        }
        return null;
    }

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

    // 現在位置が変更されたときに自動スクロール
    // スムーズスクロールのスピードを独自調整するために scrollIntoView を使わずに animate scroll を利用
    useEffect(() => {
        // カスタムスクロール速度調整（ミリ秒）
        const DURATION = 750; // ← ここを増減させるとスピードが変化（ms）
        if (scrollRef.current && current_position !== undefined) {
            console.log("current_position", current_position);
            const container = scrollRef.current;
            const originalIndex = id2Index(current_position);
            const childIndex = prompterMode
                ? (script.flat().length - 1 - originalIndex)
                : originalIndex;
            const currentElement = container.children[childIndex];
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
    }, [current_position, prompterMode]);


    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">

            <div 
                ref={scrollRef}
                className="bg-white border-2 border-gray-200 rounded-lg flex-1 overflow-y-auto p-4 space-y-1"
                style={{ maxHeight: '85vh' }}
            >
                {script.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        台本が読み込まれていません
                    </div>
                ) : (
                    (prompterMode ? [...script.flat()].reverse() : script.flat()).map((line, index) => (
                        <div 
                            key={index}
                            className={`py-2 leading-relaxed transition-colors duration-200 font-bold whitespace-pre-line text-2xl`}
                        >
                            {prompterMode ? (
                                <>
                                    <span className="inline-block" style={{ transform: 'scaleY(-1)' }}>
                                        <span className="text-xl text-gray-500 mr-4">
                                            {speaker_list.get(line.id)}
                                        </span>
                                        {line.text.replace(/\|/g, "\n")}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div key={index} className="flex justify-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-medium font-bold mr-[20em]">
                                                <span style={{ backgroundColor: color_list[performers_list.indexOf(speaker_list.get(line.id)) % color_list.length], padding: '0.2em 0.6em', borderRadius: '0.1em', display: 'inline-block' }}>
                                                    {speaker_list.get(line.id)}
                                                </span>
                                            </div>
                                            <p
                                                className={` justify-start leading-relaxed transition-colors duration-200 font-bold whitespace-pre-line`}
                                            >
                                            {line?
                                                <span>{line.text.replace(/\|/g, "\n")}</span>
                                            :
                                            null
                                            }
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    ))
                )}
            </div>
        </div>
    )
}