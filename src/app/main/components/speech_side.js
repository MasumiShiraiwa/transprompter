"use client"

import { useState, useEffect } from 'react';


import Content from './speech_side/content';
import AudioRecognition from './speech_side/audio_recognition';

export default function SpeechSide( {setCurrentPosition} ) {
    const [speech, setSpeech] = useState(null);

    useEffect(() => {
        async function fetchSimilarData() {
            if(speech === null)return;
            console.log("speech in speech_side.js", speech);
            // ここで発話内容の埋込処理を行う
            const res_emb = await fetch('/api/emb_server', {
                method: 'POST',
                body: JSON.stringify({ text_list: [speech] }),
            });

            const data_emb = await res_emb.json();
            console.log("data", data_emb.data[0][0].length);
            const embed_data = data_emb.data[0][0];

            if(embed_data === null)throw new Error("embed_data is null");
            const res_search = await fetch(`/api/zilliz_cloud/search`, {
                method: 'POST',
                body: JSON.stringify({ vector: embed_data, limit: 5, output_fields: ['*'] }),
            })
            
            if(res_search.status !== 200){
                console.error("Similar search failed");
                return;
            }

            const data_search = await res_search.json();
            console.log("data_search", data_search);

            setCurrentPosition(data_search.data.results[0].position);


 
        }
        fetchSimilarData();
    }, [speech]);

    return (
        <div className="h-full overflow-y-auto">
            <div className="min-h-full flex flex-col space-y-3 p-2">
                <div className="flex-shrink-0">
                    <Content content={speech} />
                </div>
                <div className="flex-1 min-h-0">
                    <AudioRecognition setSpeech={setSpeech} />
                </div>
            </div>
        </div>
    )
}
