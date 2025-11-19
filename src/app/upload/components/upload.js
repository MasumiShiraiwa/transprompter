"use client"

import { embed2json } from '@/app/utils/embed2json';


export default function Upload( {script} ) {

    
    const isnertEmbedding = async () => {


        const res_emb = await fetch('/api/emb_server', {
            method: 'POST',
            body: JSON.stringify({ text_list: script }),
        });
        if(res_emb.status !== 200){
            console.error("データを埋め込みできませんでした");
            return;
        }
        const data_emb = await res_emb.json(); // data.data: (script.length, 1, dim)
        console.log("text_list", script.length);
        console.log("data", data_emb.data.length, data_emb.data[0][0].length);

        // データを整形(output: [{vector: [], sentence: string, position: float}])
        const json_list = embed2json(data_emb.data, script);

        // データを更新
        const res_update = await fetch('/api/zilliz_cloud/update', {
            method: 'PUT',
            body: JSON.stringify({ data: json_list }),
        });
        if(res_update.status !== 200){
            console.error("データを更新できませんでした");
            return;
        }
        const data_update = await res_update.json();
        console.log("data", data_update.message);
        


    }
    return (
        <div>
            <button onClick={isnertEmbedding}>Insert Embedding</button>
        </div>
    )
}