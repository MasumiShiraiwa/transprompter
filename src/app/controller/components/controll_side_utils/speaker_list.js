"use client"

import { useState, useEffect } from 'react';
import { YjsInstance } from '@/app/utils/yjs/client';

export default function SpeakerList( {selectedSpeaker, setSelectedSpeaker, props_performers_list, noWrap} ) {
    const [performersList, setPerformersList] = useState(props_performers_list ?? []);
    
    return (
        <div>
            <div className={` flex gap-2`}>
                {performersList.map((speaker, index) => (
                    <button
                        key={index}
                        className={`font-medium rounded-lg border shadow-sm transition-colors duration-200 text-sm
                            border-gray-400 min-w-[50px] h-8 shrink overflow-hidden text-center
                            ${noWrap ? 'flex-nowrap truncate' : 'flex-wrap'}
                            ${selectedSpeaker === speaker
                                ? 'bg-gray-300 text-gray-800 ring-2 ring-gray-200' // 選択時: 濃いグレー背景＋白文字＋外枠強調
                                : 'bg-white text-gray-800 hover:bg-gray-200 hover:text-black'
                            }`
                        }
                        onClick={() => setSelectedSpeaker(speaker)}
                        title={speaker}
                    >
                        {speaker}
                    </button>
                ))}
            </div>
        </div>
    )
}