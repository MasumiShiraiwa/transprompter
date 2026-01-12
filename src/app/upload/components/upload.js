"use client"

import { embed2json } from '@/app/utils/embed2json';


export default function Upload( {script} ) {

    
    const isnertEmbedding = async () => {

        // 初期化
        let chunk_list = [];
        let position_list = [];
        let char_start_idx_list = [];
        let char_end_idx_list = [];

        // 句点区切り（改行を無視する）
        const no_newline_script = script.replace(/\r?\n/g, '');
        const sentence_list = no_newline_script.split('。').filter(s => s !== '');;
        chunk_list = [...sentence_list];
        position_list = sentence_list.map((_, idx) => idx);
        // INSERT_YOUR_CODE
        // char_start_idx_list と char_end_idx_listを計算する
        let current_idx = 0;
        for (let i = 0; i < sentence_list.length; i++) {
            char_start_idx_list.push(current_idx);
            current_idx += sentence_list[i].length;
            char_end_idx_list.push(current_idx - 1);
        }

        // 分割を行う。（連結は未実装）
        const proper_chunk_size = 30;
        for(let i = 0; i < sentence_list.length; i++){
            if (sentence_list[i].length > proper_chunk_size) {
                const str = sentence_list[i];
                const len = str.length;
                const n_chunks = Math.ceil(len / proper_chunk_size);
                const chunk_size = Math.round(len / n_chunks);
                let start = 0;
                let chunks = [];
                let chunk_start_indices = [];
                let chunk_end_indices = [];

                for (let k = 0; k < n_chunks; k++) {
                    let end = (k === n_chunks - 1) ? len : start + chunk_size;
                    console.log("chunk: ", str.slice(start, end));
                    chunks.push(str.slice(start, end));
                    chunk_start_indices.push(start);
                    chunk_end_indices.push(end - 1);
                    start = end;
                }
                // 元の文章はそのまま、chunk_listの末尾にチャンクを追加する
                const orig_pos = position_list[i];
                const orig_start = char_start_idx_list[i];
                for(let c = 0; c < chunks.length; c++){
                    chunk_list.push(chunks[c]);
                    position_list.push(orig_pos);
                    // チャンクの文書内での絶対位置を算出
                    char_start_idx_list.push(orig_start + chunk_start_indices[c]);
                    char_end_idx_list.push(orig_start + chunk_end_indices[c]);
                }
            }else if(sentence_list[i].length <= Math.floor(proper_chunk_size / 2)){


            }
        }


        // データを埋め込み
        const res_emb = await fetch('/api/emb_server', {
            method: 'POST',
            body: JSON.stringify({ text_list: chunk_list }),
        });
        if(res_emb.status !== 200){
            console.error("データを埋め込みできませんでした");
            return;
        }
        const data_emb = await res_emb.json();

        // データを整形(output: [{vector: [], sentence: string, sentence_idx: int, char_start_idx: int, char_end_idx: int}])
        const json_list = embed2json(data_emb.data, chunk_list, position_list, char_start_idx_list, char_end_idx_list);
        console.log("json_list", json_list);

        // データをZilliz Cloudに更新
        const res_update = await fetch('/api/zilliz_cloud/update', {
            method: 'PUT',
            body: JSON.stringify({ data: json_list }),
        });
        if(res_update.status !== 200){
            let errorMessage = `データを更新できませんでした (status: ${res_update.status}, statusText: ${res_update.statusText})`;
            try {
                const errorBody = await res_update.json();
                errorMessage += `, error: ${JSON.stringify(errorBody)}`;
            } catch (e) {
                errorMessage += ", error body could not be parsed";
            }
            console.error(errorMessage);
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