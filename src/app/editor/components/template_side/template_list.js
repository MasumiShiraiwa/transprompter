"use client"

import { useEffect, useState } from 'react';


export default function TemplateSide({ onOpenHandwrite }) {

    const [template_list, setTemplateList] = useState([]);

    useEffect(() => {
        async function initTemplateList() {
            const res = await fetch('/api/cue_card/template_list');
            const data = await res.json();
            setTemplateList(data.template_list);
        }
        initTemplateList();
    }, []);

    const handleTemplateClick = async (id) => {
        const res = await fetch('/api/pusher/cue_card_template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id }),
        });
        const data = await res.json();
        console.log(data);
        if(data.message === "Template sent successfully"){
            console.log("Template sent successfully");
        }else{
            console.error(data.message);
        }
    }

    return (
        <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2">Template List</h2>
            {template_list.length > 0 ? (
                template_list.map((item) => (
                <div 
                    key={item.id}
                    className="mb-4 p-6 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-md hover:bg-blue-50 active:scale-95 active:bg-blue-100 flex items-center justify-center min-h-[100px]"
                    onClick={() => handleTemplateClick(item.id)}
                >
                    <p className="text-2xl font-bold text-gray-800 whitespace-pre-wrap leading-relaxed text-center">{item.content}</p>
                </div>
            ))
            

            // ここに手書きで入力するフォームを追加
            ) : (
                <></>
            )}
            <div
            key={template_list.length}
            className="mb-4 p-6 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-md hover:bg-blue-50 active:scale-95 active:bg-blue-100 flex items-center justify-center min-h-[100px]"
            onClick={() => onOpenHandwrite()}
        
            >
                <p className="text-2xl font-bold text-gray-800 whitespace-pre-wrap leading-relaxed text-center flex items-center justify-center">
                    <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </span>
                </p>
            </div>
        </div>
    )
}