"use client"

import { useState, useEffect } from 'react';

export default function SpeakerList( {project_id, selectedSpeaker, onSpeakerListSelect, props_performers_list} ) {
    const [addingNewSpeaker, setAddingNewSpeaker] = useState(false);
    const [newSpeaker, setNewSpeaker] = useState("");
    const [performersList, setPerformersList] = useState(props_performers_list ?? []);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (/^[1-9]$/.test(event.key)) {
                const index = Number(event.key) - 1;  // 1から9の数字が押されたときに、出演者リストのindexを取得する。
                if (index < performersList.length && onSpeakerListSelect) {
                    onSpeakerListSelect(performersList[index]);
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };

    }, [performersList, onSpeakerListSelect]);

    // 出演者リストに追加する処理
    const updateSpeakerList = async (newSpeaker) => {
        await fetch('/api/supabase/insert', {
            method: 'POST',
            body: JSON.stringify({ table: "Performer", data: [{ project_id: project_id, name: newSpeaker }] }),
        });
        setNewSpeaker("");
    };

    // 出演者をDBから削除し、リストからも削除する
    const deleteSpeaker = async (e, speaker) => {
        e.stopPropagation();
        const res = await fetch('/api/supabase/delete', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                table: "Performer",
                where: { project_id: project_id, name: speaker },
            }),
        });
        if (!res.ok) return;
        setPerformersList((prev) => prev.filter((s) => s !== speaker));
    };

    return (
        <div>
            <div className="pt-3 flex flex-wrap items-center gap-2">
                {performersList.map((speaker, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <button
                            className={`px-4 py-2 font-medium rounded-lg border shadow-sm transition-colors duration-200 text-sm
                                border-gray-400
                                ${selectedSpeaker === speaker
                                    ? 'bg-gray-300 text-gray-800 ring-2 ring-gray-200'
                                    : 'bg-white text-gray-800 hover:bg-gray-200 hover:text-black'
                                }`}
                            onClick={() => { onSpeakerListSelect?.(speaker); }}
                        >
                            {speaker}
                        </button>
                        {isEditMode && (
                            <button
                                type="button"
                                aria-label={`${speaker}を削除`}
                                className="p-2 rounded-lg border border-gray-400 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                                onClick={(e) => deleteSpeaker(e, speaker)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border shadow-sm transition-colors duration-200
                        ${isEditMode
                            ? "border-gray-500 bg-gray-100 text-gray-800 hover:bg-gray-200"
                            : "border-gray-400 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-500"
                        }`}
                    onClick={() => setIsEditMode((prev) => !prev)}
                >
                    {isEditMode ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            完了
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            編集
                        </>
                    )}
                </button>
                <button
                    key={performersList.length}
                    type="button"
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border-2 border-dashed shadow-sm transition-colors duration-200
                        ${addingNewSpeaker
                            ? "border-gray-400 bg-white min-w-[8rem]"
                            : "border-gray-300 bg-gray-50/80 text-gray-600 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800"
                        }`}
                    onClick={() => setAddingNewSpeaker(true)}
                >
                    {addingNewSpeaker ? (
                        <input
                            type="text"
                            value={newSpeaker}
                            onChange={(e) => setNewSpeaker(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    setAddingNewSpeaker(false);
                                    setPerformersList((prev) => [...prev, newSpeaker]);
                                    updateSpeakerList(newSpeaker);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full min-w-0 py-0.5 px-1 text-left bg-transparent border-none outline-none focus:ring-0"
                            placeholder="名前を入力"
                            autoFocus
                        />
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>追加</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}