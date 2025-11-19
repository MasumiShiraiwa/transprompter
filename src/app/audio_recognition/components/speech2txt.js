'use client'

import React, { useState, useRef } from 'react';
import { getTokenOrRefresh } from '../../utils/token_util';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')


export default function Speech2txt( {setSpeech} ) { 
    const [displayText, setDisplayText] = useState('INITIALIZED: ready to test speech...');
    const [player, updatePlayer] = useState({p: undefined, muted: false});
    // 継続認識用のステートとRef
    const [isRecognizing, setIsRecognizing] = useState(false);
    let global_data = {}
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
                setSpeech(e.result.text);
                console.log(`RECOGNIZING: Text=${e.result.text}`);
            };
            
            // 2. 認識の試行が成功したことを示す最終的な認識結果を含むイベントのシグナル
            recognizer.recognized = (s, e) => {
                if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) {
                    setDisplayText(`RECOGNIZED: Text=${e.result.text}`);
                    setSpeech(e.result.text);
                    console.log(`RECOGNIZED: Text=${e.result.text}`);
                }
                else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
                    setDisplayText(`RECOGNIZED(NO MATCH): Text=${e.result.text}`);
                    setSpeech(e.result.text);
                    console.log("NOMATCH: Speech could not be recognized.");
                }
            };
            
            // 3. 認識セッション (操作) の終了を示すイベントのシグナル
            recognizer.canceled = (s, e) => {
                console.log(`CANCELED: Reason=${e.reason}`);
            
                if (e.reason == speechsdk.CancellationReason.Error) {
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
                global_data["recognizer"] = await initializeRecognizer();
                recognizerRef.current = global_data["recognizer"];
                // recognizerRef.current =  await initializeRecognizer();
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

    // 認識用
    async function sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'ja-JP';
        
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        setDisplayText('speak into your microphone...');

        recognizer.recognizeOnceAsync(result => { // 最大 30 秒間、または無音が検出されるまでの発話を文字起こし
            if (result.reason === ResultReason.RecognizedSpeech) {
                setDisplayText(`RECOGNIZED: Text=${result.text}`);
                setSpeech(result.text);
                console.log(`offset: ${result.offset}`)
                console.log(`duration: ${result.duration}`)
            } else {
                setDisplayText('ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
            }
        })

        
    }

//  ミュート機能
    async function handleMute() {
        updatePlayer(p => { 
            if (!p.muted) {
                p.p.pause();
                return {p: p.p, muted: true}; 
            } else {
                p.p.resume();
                return {p: p.p, muted: false}; 
            }
        });
    }

    return (

        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">音声認識コントロール</h2>
            
            {/* 単発認識ボタン */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <button 
                    className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 mb-3"
                    onClick={() => sttFromMic()}
                >
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    単発音声認識
                </button>
                <p className="text-sm text-gray-600">マイクから音声を文字に変換します（最大30秒）</p>
            </div>

            {/* 継続認識ボタン */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <button 
                    className={`flex items-center justify-center w-full font-bold py-3 px-6 rounded-lg transition duration-200 mb-3 ${
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
                            継続音声認識開始
                        </>
                    )}
                </button>
                <p className="text-sm text-gray-600">継続的に音声を文字に変換します</p>
            </div>

            {/* ミュートボタン */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <button 
                    className={`flex items-center justify-center w-full font-bold py-3 px-6 rounded-lg transition duration-200 mb-3 ${
                        player.muted 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                    onClick={() => handleMute()}
                >
                    {player.muted ? (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.146 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.146l4.237-3.793A1 1 0 019.383 3.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            音声復帰
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.146 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.146l4.237-3.793A1 1 0 019.383 3.076zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10a7.971 7.971 0 00-2.343-5.657 1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                            </svg>
                            音声ミュート
                        </>
                    )}
                </button>
                <p className="text-sm text-gray-600">音声出力の一時停止/再開</p>
            </div>
            {/* 結果表示パネル */}
            <div className='bg-gray-50 p-4 rounded-lg'>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">認識結果</h2>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 min-h-[200px]">
                    <div className="flex items-center mb-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                            isRecognizing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                            {isRecognizing ? '認識中...' : '待機中'}
                        </span>
                    </div>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-100 p-3 rounded">
                        {displayText}
                    </pre>
                </div>

            </div>
        </div>

    );
}