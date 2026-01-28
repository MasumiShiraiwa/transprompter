"use client"

import { useState, useEffect } from 'react';

export default function SpeakerList( {selectedSpeaker, setSelectedSpeaker, props_performers_list} ) {
    const [addingNewSpeaker, setAddingNewSpeaker] = useState(false);
    const [newSpeaker, setNewSpeaker] = useState("");
    const [performersList, setPerformersList] = useState(props_performers_list);

    useEffect(() => {
        setPerformersList(props_performers_list);
    }, []);

    
    // 出演者リストを更新するボタンを押したときの処理
    const updateSpeakerList = async (newPerformersList) => {
        const res = await fetch('/api/data_base/speaker_list/update', {
            method: 'POST',
            body: JSON.stringify({speaker_list: newPerformersList}),
        });
    }
    
    return (
        <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2">Speaker List</h2>
            <div className="flex flex-wrap gap-2">
                {performersList.map((speaker, index) => (
                    <button
                        key={index}
                        className={`px-4 py-2 font-medium rounded-lg border shadow-sm transition-colors duration-200 text-sm
                            border-gray-400
                            ${selectedSpeaker === speaker
                                ? 'bg-gray-300 text-gray-800 ring-2 ring-gray-200' // 選択時: 濃いグレー背景＋白文字＋外枠強調
                                : 'bg-white text-gray-800 hover:bg-gray-200 hover:text-black'
                            }`}
                        onClick={() => setSelectedSpeaker(speaker)}
                    >
                        {speaker}
                    </button>
                ))}
                    <button
                        key={performersList.length}
                        className={`px-4 py-2 font-medium rounded-lg border shadow-sm transition-colors duration-200 text-sm
                            border-gray-400 bg-white hover:bg-gray-200`}
                        onClick={() => setAddingNewSpeaker(true)}>
                            {addingNewSpeaker ? (
                                <input type="text" value={newSpeaker}  onChange={(e) => setNewSpeaker(e.target.value)} 
                                onKeyDown={e => { if(e.key === 'Enter'){
                                    setAddingNewSpeaker(false);
                                    setPerformersList((prev) => [...prev, newSpeaker]);
                                    setNewSpeaker("");
                                    updateSpeakerList([...performersList, newSpeaker]);
                                }}} 
                                className="w-full h-full py-2 px-2" />
                            ) : (
                                <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                </>
                            )}
                    </button>
            </div>
        </div>
    )
}