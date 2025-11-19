"use client"

import { useEffect, useState } from 'react';

export default function Content( {content} ) {
    const [content_list, setContentList] = useState([]);

    useEffect(() => {
        if (content && content.trim() !== '') {
            setContentList([content, ...content_list]);
        }
    }, [content]);

    return (
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">発話履歴</h3>
            <div className=" bg-white border-2 border-gray-200 rounded-lg overflow-y-auto"
                 style={{ height: '150px' }}>
                {content_list.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        発話がまだありません
                    </div>
                ) : (
                    <div className="p-2 space-y-2">
                        {content_list.map((speech, index) => (
                            <div 
                                key={index} 
                                className="bg-blue-50 border border-blue-100 rounded-lg p-3 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <p className="text-sm text-gray-800 flex-1">{speech}</p>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                        #{content_list.length - index}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}