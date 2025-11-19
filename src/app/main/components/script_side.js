"use client"

import { useState, useEffect, useRef } from 'react';

export default function ScriptSide( {scripts, current_position} ) {
    const scrollRef = useRef(null);

    // 現在位置が変更されたときに自動スクロール
    useEffect(() => {
        if (scrollRef.current && current_position !== undefined) {
            const currentElement = scrollRef.current.children[current_position];
            if (currentElement) {
                currentElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [current_position]);

    return (
        <div className="bg-gray-50 p-4 rounded-lg h-full flex flex-col">
            <div>current_position: {current_position}</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">台本パネル</h2>
            <div 
                ref={scrollRef}
                className="bg-white border-2 border-gray-200 rounded-lg flex-1 overflow-y-auto p-4 space-y-1"
                style={{ maxHeight: '85vh' }}
            >
                {scripts.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        台本が読み込まれていません
                    </div>
                ) : (
                    scripts.map((script, index) => (
                        <p 
                            key={index} 
                            className={`text-2xl py-1 leading-relaxed transition-colors duration-200 ${
                                index === current_position 
                                    ? "text-gray-800 font-bold px-2 rounded" 
                                    : "text-gray-400 text-lg"
                            }`}
                        >
                            <span className="text-sm text-gray-500 mr-2">
                                {index + 1}.
                            </span>
                            {script}
                        </p>
                    ))
                )}
            </div>
        </div>
    )
}