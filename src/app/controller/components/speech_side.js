"use client"

import { useState, useEffect, useRef } from 'react';


import Content from './speech_side_utils/content';
import AudioRecognition from './speech_side_utils/audio_recognition';
import { predictPositionByVector, predictPositionByLLM } from '@/app/utils/predict_sentence_position';

import { getTokenOrRefresh } from '@/app/utils/token_util';
// import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

export default function SpeechSide( {script, speechHistory, setSpeechHistory, isRecognizing, setIsRecognizing, current_position, setCurrentPosition, sentence_idx_max, cueCardMode} ) {
    const [speech, setSpeech] = useState({text: null, isSentenceCompleted: false});
    const [score_list, setScoreList] = useState({}); // 削除予定{char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
    const [weigh_list, setWeighList] = useState({}); // 削除予定{char_idx1: {score:}, char_idx2: {score:}, ...}
    const [raw_score_list, setRawScoreList] = useState({}); // 削除予定{char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
    const useLLM = true; // LLMの使用をONにするかを決める変数
    const speechHistoryRef = useRef([]);

    const id2Index = (id) => {
        for (const k of Object.keys(script)) {
            if (script[k].id === id) {
                return Number(k);
            }
        }
        return null;
    };

    const index2Id = (index) => {
        for (let k of Object.keys(script)) {
            if (Number(k) === index) {
                return script[k].id;
            }
        }
        return null;
    };

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

        // useEffect内でデータ取得するのは良くない？？ 
        // そこでデータ取得をするならReact QueryやSWRなどを利用しましょう。
        async function fetchPositionByLLM() {
            if(speech.text === null)return;
            let start_time = performance.now(); // debug
            const result = await predictPositionByLLM(speech, speechHistory.join(""), id2Index(current_position), Object.keys(script).map(k => {return {index: k, text: script[k].text}}));
            console.log("predict time[ms]", performance.now() - start_time, speech, result.position); // debug
            if(result.position !== ""){
                setCurrentPosition(index2Id(result.position)); 
            }
            if (result.found_speech !== "") {
                if(speechHistoryRef.current.some(item => item === result.found_speech)){
                    return;
                }
                setSpeechHistory(prev => [...prev, result.found_speech]);
                speechHistoryRef.current.push(result.found_speech);
            }
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

    // 音声認識用のステートとRef
    const [displayText, setDisplayText] = useState('INITIALIZED: ready to test speech...'); //　表示用認識結果。リアルタイムで表示する。
    const streamSpeech = useRef(''); // ストリーミング認識用のステートとRef
    const timeStamp = useRef([0.0]); // ストリーミング認識用の時刻を記録する。
    
    // 継続認識用のステートとRef
    // const [isRecognizing, setIsRecognizing] = useState(false);
    const recognizerRef = useRef(null);

    // XXX秒ごとに実行
    const intervalRef = useRef(null);
    useEffect(() => {
        // アンマウント時に音声認識とインターバルをクリーンアップ
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (recognizerRef.current) {
                try {
                    recognizerRef.current.stopContinuousRecognitionAsync(
                        (result) => {console.log("Stop Recognition: ", result); setIsRecognizing(false);},
                        (err) => {console.error("Failed to stop recognition: ", err); }
                    );
                } catch (e) {
                    console.error('Failed to stop recognizer on unmount', e);
                }
            }
        };
    }, []);

    // 【共通】Recognizerの初期化
    const initializeRecognizer = async() => {
        try{
            const tokenObj = await getTokenOrRefresh();
            const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
            speechConfig.speechRecognitionLanguage = 'ja-JP';

            // 区切り時間を500msに設定する。
            speechConfig.setProperty(
                speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
                "500" // default is 1000ms
            );

            // 認識結果をTrueTextで返す。
            // これを設定しないと、認識結果に句点が含まれない場合がある。
            speechConfig.setProperty(
                speechsdk.PropertyId.SpeechServiceResponse_PostProcessingOption,
                "TrueText"
            );
                

            speechConfig.enableDictation();
        
            const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
            let start_time = performance.now(); // debug

            // サブスクライブ処理
            // 1.中間的な認識結果を含むイベントのシグナル
            recognizer.recognizing = (s, e) => {
                setDisplayText(`RECOGNIZED: Text=${e.result.text}`);
                streamSpeech.current = e.result.text;
                // console.log("recognize time[ms]", performance.now() - start_time); // debug
                // console.log(`RECOGNIZING: Text=${e.result.text}`);
                // console.log("Offset in Ticks: (開始時刻[ms])" + e.result.offset);
                // console.log("Duration in Ticks: (経過時間[ms])" + e.result.duration);
                timeStamp.current.push(e.result.duration);
            };
            
            // 2. 認識の試行が成功したことを示す最終的な認識結果を含むイベントのシグナル
            recognizer.recognized = (s, e) => {
                if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) { // 認識成功
                    setDisplayText(`RECOGNIZED: Text=${e.result.text}`);
                    let text = e.result.text;
                    if (text.includes("。") + 1 < text.length) { // 最後の文だけを残す。
                        text = text.slice(0, -1);
                        text = text.slice(text.lastIndexOf("。") + 1);
                    }
                    
                    if (text.length > 10) {
                        setSpeech({text: text, isSentenceCompleted: true});
                        console.log("recognize time[ms]", performance.now() - start_time); // debug
                        console.log(`RECOGNIZED: Text=${text}`);
                    }
                    start_time = performance.now(); // debug
                    streamSpeech.current = "";
                }
                else if (e.result.reason == speechsdk.ResultReason.NoMatch) { // 認識失敗
                    setDisplayText(`RECOGNIZED(NO MATCH): Text=${e.result.text}`);
                    // setSpeech({text: e.result.text, isSentenceCompleted: false});
                    console.log("NOMATCH: Speech could not be recognized.");
                }
            };
            
            // 3. 認識セッション (操作) の終了を示すイベントのシグナル
            recognizer.canceled = (s, e) => {
                console.log(`CANCELED: Reason=${e.reason}`);
            
                if (e.reason == speechsdk.CancellationReason.Error) { // 認識エラー
                    console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                    console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                    console.log("CANCELED: Did you set the speech resource key and region values?");
                }
            
                setIsRecognizing(false);
            };
            
            // 4. キャンセルされた認識結果を含むイベントのシグナル
            recognizer.sessionStopped = (s, e) => {
                console.log("\n    Session stopped event.");
                setIsRecognizing(false);
            };
    
            return recognizer;
            console.log(recognizer)
            recognizerRef.current = recognizer;
    

        }catch (e) {
            console.error("Failed to get token: ", e)
            return;
        }
    };
    
    // 音声認識中の場合、XXX秒ごとに実行
    function setIntervalFunction() {
        const nextIsRecognizing = !isRecognizing;
        if (!nextIsRecognizing) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        if (nextIsRecognizing) {
            // 二重起動防止のため、既に動いている場合はクリアしてから再セット
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(() => {
                console.log("streamSpeech.current", streamSpeech.current);
                const sentence_list = streamSpeech.current.split("。");
                console.log("sentence_list", sentence_list)
                // if (sentence_list.length > 1) {
                //     if (previousSpeech.current != sentence_list[sentence_list.length - 2]){
                //         if(sentence_list[sentence_list.length - 2].length > 10){
                //             setSpeech({text: sentence_list[sentence_list.length - 2], isSentenceCompleted: true});
                //             previousSpeech.current = sentence_list[sentence_list.length - 2];
                //         }else{
                //             setSpeech({text: sentence_list[sentence_list.length - 2] + sentence_list[sentence_list.length - 1], isSentenceCompleted: false});
                //             previousSpeech.current = sentence_list[sentence_list.length - 1];
                //         }
                //     }
                //     if (sentence_list[sentence_list.length - 1].length > 0) {
                //         streamSpeech.current = sentence_list[sentence_list.length - 1];
                //     }
                // }
                // if (streamSpeech.current.length > 15) {
                //     setSpeech({text: streamSpeech.current, isSentenceCompleted: false});
                // }
                if (streamSpeech.current.length > 10) {
                    setSpeech({text: streamSpeech.current, isSentenceCompleted: false});
                }
            }, 1000);
            console.log("intervalId", intervalRef.current);
        }
        // クリーンアップ
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
    }

    async function switchRecognition() {
        const nextIsRecognizing = !isRecognizing;
        if (!recognizerRef.current) {
            try{
                recognizerRef.current =  await initializeRecognizer();
            }catch(e){
                console.error("Failed to get recognizer: ", e)
                return;
            }
        }

        if (nextIsRecognizing){
            // 認識開始
            recognizerRef.current.startContinuousRecognitionAsync((result) => {
                setDisplayText('speak into your microphone...');
                console.log("Start Recognition: ", result);
                setIsRecognizing(true);
            }, (err) => {
                console.error("Failed to start recognition: ", err);
                setIsRecognizing(false);
            });
        } else {
            // 認識停止
            recognizerRef.current.stopContinuousRecognitionAsync((result) => {
                console.log("Stop Recognition: ", result);
                setIsRecognizing(false);
            }, (err) => {
                console.error("Failed to stop recognition: ", err);
                setIsRecognizing(false);
            });
        };

    }
    // 音声認識ボタンを押したときの処理
    const handleRecognitionButton = async () => {
        if (!cueCardMode) { // ナレーションモードの場合は、音声認識を開始する。
            setFirstSpeechHistory();
            setIntervalFunction();
            switchRecognition()
            // setIsRecognizing(!isRecognizing);
        }else{
            setIsRecognizing(false);
            alert("カンペモードの場合は、音声認識を開始できません。");
        }
    }

    const setFirstSpeechHistory = () => {
        let temp_speech_history = [];
        for (const [k, v] of Object.entries(script)) {
            if(v.id === current_position){
                temp_speech_history.push(v.text);
                break;
            }
            temp_speech_history.push(v.text);
        };
        console.log("temp_speech_history", temp_speech_history);
        setSpeechHistory(temp_speech_history);
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="min-h-full flex flex-col space-y-3 p-2">
                {/* 音声認識ボタン */}
                <button 
                    className={`flex items-center justify-center w-full font-bold my-3 py-3 px-6 rounded-lg transition duration-200 ${
                        isRecognizing 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    onClick={() => handleRecognitionButton()}
                >
                    {isRecognizing ? (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" />
                            </svg>
                            認識停止
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                            </svg>
                            音声認識開始
                        </>
                    )}
                </button>
                <div className="flex-shrink-0">
                    <Content content={speech.text} isRecognizing={isRecognizing} setIsRecognizing={setIsRecognizing} />
                </div>
                <div className="flex-1 min-h-0">
                    <AudioRecognition setSpeech={setSpeech} isRecognizing={isRecognizing} displayText={displayText} />
                </div>
            </div>
        </div>
    )
}
