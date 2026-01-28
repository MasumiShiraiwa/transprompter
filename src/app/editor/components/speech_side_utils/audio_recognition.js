"use client"

import { getTokenOrRefresh } from '../../../utils/token_util';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

import { useState, useRef, useEffect } from 'react';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default function AudioRecognition( {setSpeech, isRecognizing, setIsRecognizing} ) {
    const [displayText, setDisplayText] = useState('INITIALIZED: ready to test speech...'); //　表示用認識結果。リアルタイムで表示する。
    const streamSpeech = useRef(''); // ストリーミング認識用のステートとRef
    const previousSpeech = useRef('');
    const timeStamp = useRef([0.0]); // ストリーミング認識用の時刻を記録する。
    
    // 継続認識用のステートとRef
    // const [isRecognizing, setIsRecognizing] = useState(false);
    const recognizerRef = useRef(null);
    let intervalId = NaN;


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

    // XXX秒ごとに実行
    const intervalRef = useRef(null);
    useEffect(() => {

        // 音声認識中の場合、XXX秒ごとに実行
        function setIntervalFunction() {
            if (!isRecognizing) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                return;
            }

            if (isRecognizing) {
                // 二重起動防止のため、既に動いている場合はクリアしてから再セット
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }

                intervalRef.current = setInterval(() => {
                    const sentence_list = streamSpeech.current.split("。");
                    console.log("sentence_list", sentence_list)
                    if (sentence_list.length - 1> 0) {
                        if (previousSpeech.current != sentence_list[sentence_list.length - 2]){
                            sentence_list[sentence_list.length - 2].length > 10? setSpeech({text: sentence_list[sentence_list.length - 2], isSentenceCompleted: true}):null;
                            previousSpeech.current = sentence_list[sentence_list.length - 2];
                        }
                        if (sentence_list[sentence_list.length - 1].length > 0) {
                            streamSpeech.current = sentence_list[sentence_list.length - 1];
                        }
                    }
                    if (streamSpeech.current.length > 15) {
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
            if (!recognizerRef.current) {
                try{
                    recognizerRef.current =  await initializeRecognizer();
                }catch(e){
                    console.error("Failed to get recognizer: ", e)
                    return;
                }
            }
    
            if (isRecognizing){
              // 認識開始
                recognizerRef.current.startContinuousRecognitionAsync((result) => {
                    setDisplayText('speak into your microphone...');
                    console.log("Start Recognition: ", result);
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
                });
            };

        }


        setIntervalFunction();
        switchRecognition();
    }, [isRecognizing])
          

    // ストリーミング認識用
    async function handleSttStreaming(){
        // setIsRecognizing(!isRecognizing);
        return; // 音声認識の開始と停止はisRecognizingで管理(ControlSideから)する。

        if (!recognizerRef.current) {
            try{
                recognizerRef.current =  await initializeRecognizer();
            }catch(e){
                console.error("Failed to get recognizer: ", e)
                return;
            }
        }

        if (!isRecognizing){
          // 認識開始
            recognizerRef.current.startContinuousRecognitionAsync((result) => {
                setDisplayText('speak into your microphone...');
                console.log("Start Recognition: ", result);
                setIsRecognizing(true);
            }, (err) => {
                console.error("Failed to start recognition: ", err);
            });
        } else {
            // 認識停止
            recognizerRef.current.stopContinuousRecognitionAsync((result) => {
                console.log("Stop Recognition: ", result);
                setIsRecognizing(false);
            }, (err) => {
                console.error("Failed to stop recognition: ", err);
            });
        };

    }



    return (

        <div className="flex flex-col space-y-3">
            

            {/* 結果表示パネル */}
            <div className='bg-gray-50 p-4 rounded-lg flex flex-col'>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">認識結果</h2>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex flex-col"
                     style={{ height: '100px' }}>
                    <div className="flex items-center mb-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                            isRecognizing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                            {isRecognizing ? '認識中...' : '待機中'}
                        </span>
                    </div>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-100 p-3 rounded flex-1 overflow-y-auto">
                        {displayText}
                    </pre>
                </div>

            </div>

            {/* デバッグ用入力パネル */}
            <div>
                <input type="text" placeholder="デバッグ用入力" id="debug_input" />
                <button onClick={() => setSpeech({text: document.getElementById('debug_input').value, isSentenceCompleted: true})}>送信</button>
            </div>
        </div>

    );
}
