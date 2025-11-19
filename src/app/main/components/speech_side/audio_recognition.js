"use client"

import { getTokenOrRefresh } from '../../../utils/token_util';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

import { useState, useRef } from 'react';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default function AudioRecognition( {setSpeech} ) {
    const [displayText, setDisplayText] = useState('INITIALIZED: ready to test speech...'); //　表示用認識結果。リアルタイムで表示する。
    
    // 継続認識用のステートとRef
    const [isRecognizing, setIsRecognizing] = useState(false);
    const recognizerRef = useRef(null);


    // 【共通】Recognizerの初期化
    const initializeRecognizer = async() => {
        try{
            const tokenObj = await getTokenOrRefresh();
            const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
            speechConfig.speechRecognitionLanguage = 'ja-JP';
        
            const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
            const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

            // サブスクライブ処理
            // 1.中間的な認識結果を含むイベントのシグナル
            recognizer.recognizing = (s, e) => {
                setDisplayText(`RECOGNIZING: Text=${e.result.text}`);
                // setSpeech(e.result.text);
                console.log(`RECOGNIZING: Text=${e.result.text}`);
            };
            
            // 2. 認識の試行が成功したことを示す最終的な認識結果を含むイベントのシグナル
            recognizer.recognized = (s, e) => {
                if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) { // 認識成功
                    setDisplayText(`RECOGNIZED: Text=${e.result.text}`);
                    setSpeech(e.result.text);
                    console.log(`RECOGNIZED: Text=${e.result.text}`);
                }
                else if (e.result.reason == speechsdk.ResultReason.NoMatch) { // 認識失敗
                    setDisplayText(`RECOGNIZED(NO MATCH): Text=${e.result.text}`);
                    setSpeech(e.result.text);
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
            
                recognizer.stopContinuousRecognitionAsync();
            };
            
            // 4. キャンセルされた認識結果を含むイベントのシグナル
            recognizer.sessionStopped = (s, e) => {
                console.log("\n    Session stopped event.");
                recognizer.stopContinuousRecognitionAsync();
            };
    
            return recognizer;
            console.log(recognizer)
            recognizerRef.current = recognizer;
    

        }catch (e) {
            console.error("Failed to get token: ", e)
            return;
        }
    };
    

    // ストリーミング認識用
    async function handleSttStreaming(){
        if (!recognizerRef.current) {
            try{
                recognizerRef.current =  await initializeRecognizer();
            }catch(e){
                console.error("Failed to get recognizer: ", e)
                return;
            }
        }

        // 認識中であればSTOP
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
            

            {/* 継続認識ボタン */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">音声認識パネル</h2>
                <button 
                    className={`flex items-center justify-center w-full font-bold py-3 px-6 rounded-lg transition duration-200 ${
                        isRecognizing 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    onClick={() => handleSttStreaming()}
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
            </div>

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
        </div>

    );
}
