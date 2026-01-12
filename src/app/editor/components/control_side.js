"use client"

import { useEffect } from 'react';

export default function ControlSide({cueCardMord, setCueCardMord, isRecognizing, setIsRecognizing, current_position, setCurrentPosition}) {

    const switchDisplayMode= async () => {
        // API呼び出し
        const body = { mode: !cueCardMord };
        const res_mode_switch = await fetch('/api/pusher/mode_switch', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_mode_switch = await res_mode_switch.json();
        console.log("mode_switch event sent: ", data_mode_switch);
        setCueCardMord(!cueCardMord);
    } 


    const handleRecognitionButton = async () => {
        if (!cueCardMord) { // ナレーションモードの場合は、音声認識を開始する。
            setIsRecognizing(!isRecognizing);
        }else{
            setIsRecognizing(false);
            alert("カンペモードの場合は、音声認識を開始できません。");
        }
    }

    const handlePreviousButton = async () => {
        setCurrentPosition(current_position - 1);
    }

    const handleNextButton = async () => {
        setCurrentPosition(current_position + 1);
    }

    return (
        <div>
            <h2 className="font-bold text-lg text-gray-700">操作パネル</h2>
            
            <button onClick={() => switchDisplayMode()}>
                現在のモード：{cueCardMord ? "カンペモード" : "ナレーションモード"}
            </button>

            {/* 音声認識ボタン */}
            <button 
                className={`flex items-center justify-center w-full font-bold py-3 px-6 rounded-lg transition duration-200 ${
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

            {/* 再生制御ボタン群 */}
            <div className="flex items-center justify-center space-x-4 mt-6">
                {/* 左向きボタン */}
                <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors" aria-label="Previous"
                onClick={() => handlePreviousButton()}>
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* 停止再生ボタン */}
                <button 
                    className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors shadow-lg" 
                    aria-label={isRecognizing ? "Stop" : "Play"}
                    onClick={() => handleRecognitionButton()}
                >
                    {isRecognizing ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* 右向きボタン */}
                <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors" aria-label="Next"
                onClick={() => handleNextButton()}>
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

        </div>
    )
}