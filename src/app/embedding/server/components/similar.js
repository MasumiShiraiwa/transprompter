'use client'

import { useState, useEffect } from 'react'

export default function Similar( {embed_data} ) {
    const [similar_list, setSimilarList] = useState([]);
    
    useEffect(() => {
        async function fetchSimilarData() { // 内部でasync関数を定義する。
            if(embed_data === null)throw new Error("embed_data is null");
            const res = await fetch(`/api/zilliz_cloud/search`, {
                method: 'POST',
                body: JSON.stringify({ vector: embed_data, limit: 5, output_fields: ['sentence'] }),
            })
            if(res.status !== 200){
                console.error("Similar search failed");
                return;
            }
            const data = await res.json();
            console.log("data", data);
            setSimilarList(data.data.results);
        }
        
        fetchSimilarData();
    }, [embed_data]);

    return (
        <div>
            <h2>Similar</h2>
            <ul>
                {similar_list.map((item, index) => (
                    <li key={index}>{item.sentence}{item.score}</li>
                ))}
            </ul>
        </div>
    )
}