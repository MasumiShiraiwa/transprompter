"use client"

import { useState, useEffect, useRef } from 'react';

export default function CueCard( {script, speaker_list, current_position, performers_list} ) {
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
    const [fontSize, setFontSize] = useState(48); // 初期のフォントサイズ（px）
    const containerRef = useRef(null);

    // script変更時やcurrent_position変更時にフォントサイズを調整
    useEffect(() => {
        if (!containerRef.current || !script || script.length === 0) return;

        // 現在のグループを特定
        let activeGroup = null;
        let activeGroupStartIdx = 0;
        let idx = 0;
        for (let group of script) {
            if (idx <= current_position && idx + group.length > current_position) {
                activeGroup = group;
                activeGroupStartIdx = idx;
                break;
            }
            idx += group.length;
        }

        if (!activeGroup) return;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const paddingX = 32; // 左右のパディング (p-4 * 2)
        const paddingY = 32; // 上下のパディング
        const maxWidth = containerWidth - paddingX;
        const maxHeight = containerHeight - paddingY;

        const ctx = document.createElement('canvas').getContext('2d');

        const maxFontSize = 60; // 上限サイズ (これ以上大きくならない)
        const minSize = 10; // 最小サイズ
        let size = maxFontSize;

        // サイズを大きい方から試して、収まる最大サイズを探す
        for (; size >= minSize; size -= 2) {
            let currentY = 0;
            let isOverflow = false;

            const speakerFontSize = size * 0.8;
            const speakerLineHeight = speakerFontSize * 1.5; // およその行の高さ
            const speakerMarginBottom = 8; // mb-2 (0.5rem)

            const contentFontSize = size;
            const contentLineHeight = contentFontSize * 1.625; // leading-relaxed
            const contentPaddingY = 8; // py-1 (0.25rem * 2)

            for (let i = 0; i < activeGroup.length; i++) {
                const lineContent = activeGroup[i];
                const speakerName = speaker_list[activeGroupStartIdx + i];

                // --- スピーカー名の高さ計算 ---
                ctx.font = `bold ${speakerFontSize}px sans-serif`;
                const speakerText = `( ${speakerName} )`;
                const speakerMetrics = ctx.measureText(speakerText);
                // パディング分 (0.6em * 2) を考慮
                const speakerTotalWidth = speakerMetrics.width + (speakerFontSize * 1.2);
                
                // 幅に収まらない場合の折り返し行数を計算
                const speakerLines = Math.max(1, Math.ceil(speakerTotalWidth / maxWidth));
                currentY += (speakerLines * speakerLineHeight) + speakerMarginBottom;

                // --- 本文の高さ計算 ---
                ctx.font = `bold ${contentFontSize}px sans-serif`;
                const contentSegments = lineContent ? lineContent.replace(/\|/g, "\n").split('\n') : [""];

                let contentHeight = 0;
                for (let segment of contentSegments) {
                    const segmentMetrics = ctx.measureText(segment);
                    // 幅に収まらない場合の折り返し行数を計算
                    const lines = Math.max(1, Math.ceil(segmentMetrics.width / maxWidth));
                    contentHeight += lines * contentLineHeight;
                }
                currentY += contentHeight + contentPaddingY;

                if (currentY > maxHeight) {
                    isOverflow = true;
                    break;
                }
            }

            if (!isOverflow) {
                break;
            }
        }

        setFontSize(size);
    }, [script, speaker_list, current_position]);

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700">台本パネル</h2>
                </div>
            </div>
            <div 
                    ref={containerRef}
                    className="bg-white border-2 border-gray-200 rounded-lg flex-1 overflow-y-auto p-4 space-y-1"
                    style={{ maxHeight: '85vh' }}
                >
                    {script.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            台本が読み込まれていません
                        </div>
                    ) : ( // scriptの長さが1以上の場合
                        (() => {
                                let globalIndex = 0;
                                for(let i = 0; i < script.length; i++){
                                    if(globalIndex <= current_position && globalIndex + script[i].length > current_position){
                                        return script[i].map((line, localIdx) => {
                                            return (
                                                <div key={localIdx}>
                                                    <div className="text-sm font-bold mb-2" style={{ fontSize: `${fontSize * 0.8}px` }}>
                                                        <span style={{ backgroundColor: color_list[performers_list.indexOf(speaker_list[globalIndex + localIdx]) % color_list.length], padding: '0.2em 0.6em', borderRadius: '0.1em', display: 'inline-block' }}>
                                                            (  {speaker_list[globalIndex + localIdx]} )
                                                        </span>
                                                    </div>
                                                    <p
                                                        className={`py-1 leading-relaxed transition-colors duration-200 font-bold whitespace-pre-line`}
                                                        style={{ fontSize: `${fontSize}px` }}
                                                    >
                                                    {line?
                                                        <span>{line.replace(/\|/g, "\n")}</span>
                                                    :
                                                    null
                                                    }
                                                    </p>
                                                </div>
                                            )
                                        });
                                    }else{
                                        globalIndex += script[i].length;
                                    }
                                }
                        })()
                    )}
                </div>
        </div>
    )
}