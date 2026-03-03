"use client"

import { useState, useEffect } from 'react';

export default function DataList({ candidate_list, setNewScript, setIsProcessing}) {
    const [checkList, setCheckList] = useState(new Array(candidate_list.length).fill(false));

    const handleCreate = () => {
        let new_script = [];
        checkList.forEach((item, index) => {
            if(item){
                new_script.push(candidate_list[index].text === "" ? undefined : candidate_list[index].text);
            }
        })
        setNewScript(new_script);
        setIsProcessing(false);
    }

    const toggleCheck = (index) => {
        setCheckList(prev => {
            const newCheckList = [...prev];
            newCheckList[index] = !newCheckList[index];
            return newCheckList;
        });
    };

    return (
        <div className="space-y-1">
            {candidate_list.map((item) => (
                <label
                    key={item.index}
                    htmlFor={`candidate-check-${item.index}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors select-none"
                >
                    <input
                        id={`candidate-check-${item.index}`}
                        type="checkbox"
                        checked={checkList[item.index]}
                        onChange={() => toggleCheck(item.index)}
                        className="mt-0.5 shrink-0 w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span className="flex-1 min-w-0 text-sm">
                        <span className="font-medium text-gray-700">{item.speaker}: </span>
                        <span className="text-gray-600">{item.text}</span>
                    </span>
                </label>
            ))}
            <button
                type="button"
                className={`w-full my-3 py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-white border border-violet-600 shadow-sm bg-violet-500 hover:bg-violet-600 cursor-pointer`}
                onClick={() => handleCreate()}
            >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>新規作成</span>
            </button>

        </div>
    )
}