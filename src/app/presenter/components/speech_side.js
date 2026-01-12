"use client"

import { useState, useEffect } from 'react';


import Content from './speech_side/content';
import AudioRecognition from './speech_side/audio_recognition';
import ScoreList from './speech_side/score_list';
import { predictPositionByVector, predictPositionByLLM } from '@/app/utils/predict_sentence_position';

export default function SpeechSide( {script, current_position, setCurrentPosition, sentence_idx_max} ) {
    const [speech, setSpeech] = useState({text: null, isSentenceCompleted: false});
    const [score_list, setScoreList] = useState({}); // {char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
    const [weigh_list, setWeighList] = useState({}); // {char_idx1: {score:}, char_idx2: {score:}, ...}
    const [raw_score_list, setRawScoreList] = useState({}); // {char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
    const [speech_history, setSpeechHistory] = useState([]);
    const useLLM = true; // LLMの使用をONにするかを決める変数



    // 新しい発話内容が入力されたら、類似度検索を行う。
    useEffect(() => {
        async function fetchSimilarDataByVector() {
            if(speech.text === null)return;
            console.log("speech in speech_side.js:", speech);
            // ここで発話内容の埋込処理を行う
            let start_time = performance.now(); // debug
            const res_emb = await fetch('/api/emb_server', {
                method: 'POST',
                body: JSON.stringify({ text_list: [speech.text] }),
            });
            console.log("emb time[ms]", performance.now() - start_time, speech.text); // debug

            const data_emb = await res_emb.json();
            // console.log("data", data_emb.data[0][0].length);
            const embed_data = data_emb.data[0][0];

            if(embed_data === null)throw new Error("embed_data is null");
            start_time = performance.now(); // debug

            // 類似度検索を行う。
            const res_search = await fetch(`/api/zilliz_cloud/search`, {
                method: 'POST',
                body: JSON.stringify({ vector: embed_data, limit: 10, output_fields: ['sentence_idx', 'char_start_idx', 'char_end_idx'] }),
            })
            console.log("search time[ms]", performance.now() - start_time, speech); // debug
            if(res_search.status !== 200){
                console.error("Similar search failed");
                return;
            }
            const data_search = await res_search.json().then(data => data.data.results);
            console.log("data_search", data_search);
            setRawScoreList(prev => {
                const next = { ...prev }; // ←コピー
                for (let char_idx in next) {
                    data_search.forEach(result => {
                        if (char_idx >= result.char_start_idx && char_idx <= result.char_end_idx) {
                            next[char_idx].score = result.score;
                            next[char_idx].sentence_idx = result.sentence_idx;
                        }
                    });
                }
                return next;
            });

            // ランキングから、TOPを取得。
            start_time = performance.now(); // debug
            const sentence_idx = await predictPositionByVector(
                score_list,
                setScoreList,
                [structuredClone(data_search)],
                current_position,
                sentence_idx_max,
                setWeighList,
                setRawScoreList
            );
            console.log("predict time[ms]", performance.now() - start_time, speech); // debug
            console.log("sentence_idx", sentence_idx);
            setCurrentPosition(sentence_idx);
        }

        async function fetchPositionByLLM() {
            if(speech.text === null)return;
            let start_time = performance.now(); // debug
            const result = await predictPositionByLLM(speech, speech_history.join('。'), current_position, script);
            console.log("predict time[ms]", performance.now() - start_time, speech); // debug
            const new_speech = result.new_speech;
            if (new_speech !== "") {
                return;
                setCurrentPosition(result.position);
                const res_update_pos = await fetch('/api/pusher/update_position', {
                    method: 'POST',
                    body: JSON.stringify({ position: result.position }),
                });
                if(res_update_pos.status !== 200){
                    console.error("update position failed");
                    return;
                }

                setSpeechHistory(prev => [...prev, new_speech]);
            }
            // console.log("sentence_idx", sentence_idx, "new_speech", new_speech);
            // console.log("history", speech_history);
        }

        if (useLLM) {
            fetchPositionByLLM();

        }else{
            fetchSimilarDataByVector();
        }
    }, [speech]);

    // 初期化時に、score_list全体を更新する。
    useEffect(() => {
        async function fetchGetAllData() {            
            // 全体のデータを取得する。
            const res_get_all = await fetch(`/api/zilliz_cloud/get_all`);
            if(res_get_all.status !== 200){
                console.error("get all data failed");
                return;
            }
            const data_get_all = await res_get_all.json();
            // score_list: {char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
            setScoreList(prev => {
                const next = { ...prev }; // ←コピー
            
                data_get_all.data.forEach(item => {
                  for (let i = item.char_start_idx; i <= item.char_end_idx; i++) {
                    if (!(i in next)) {
                      next[i] = { score: 0, sentence_idx: item.sentence_idx };
                    }
                  }
                });
            
                return next;
              });
              setRawScoreList(prev => {
                const next = { ...prev }; // ←コピー
            
                data_get_all.data.forEach(item => {
                  for (let i = item.char_start_idx; i <= item.char_end_idx; i++) {
                    if (!(i in next)) {
                      next[i] = { score: 0, sentence_idx: item.sentence_idx };
                    }
                  }
                });
            
                return next;
              });

            setWeighList(prev => {
                const next = { ...prev };
                data_get_all.data.forEach(item => {
                    for (let i = item.char_start_idx; i <= item.char_end_idx; i++) {
                        if (!(i in next)) {
                            next[i] = { score: 0 };
                        }
                    }
                });
                return next;
            });
            
        }

        async function fetchLoadCollection() {
            // 明示的にCollectionをロードする。
            const res_load_collection = await fetch(`/api/zilliz_cloud/load_collection`);
            if(res_load_collection.status !== 200){
                console.error("load collection failed");
                return;
            }
        }

        if ( !useLLM ) {
            fetchGetAllData(); // 初期化時に、score_list全体を更新する。
            fetchLoadCollection(); // 初期化時に、Collection(vector, sentence)を明示的にロードする。
        }


    }, []);

    return (
        <div className="h-full overflow-y-auto">
            <div className="min-h-full flex flex-col space-y-3 p-2">
                <div className="flex-shrink-0">
                    <Content content={speech.text} />
                </div>
                <div className="flex-1 min-h-0">
                    <ScoreList scoreList={score_list} weighList={weigh_list} rawScoreList={raw_score_list} />
                    <AudioRecognition setSpeech={setSpeech} />
                </div>
            </div>
        </div>
    )
}
