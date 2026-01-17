"use client"

import { useState, useEffect } from 'react';
import SpeakerList from './controll_side_utils/speaker_list';
import Grouping from './controll_side_utils/grouping';

export default function ControlSide({script, setScript, cueCardMord, setCueCardMord, prompterMode, setPrompterMode, isRecognizing, setIsRecognizing, current_position, setCurrentPosition, sentence_idx_max, selectedSpeaker, setSelectedSpeaker, groupIndex, setGroupIndex, performers_list}) {

    // 表示モード切替ボタンを押したときの処理
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

    // 音声認識ボタンを押したときの処理
    const handleRecognitionButton = async () => {
        if (!cueCardMord) { // ナレーションモードの場合は、音声認識を開始する。
            // setIsRecognizing(!isRecognizing);
        }else{
            setIsRecognizing(false);
            alert("カンペモードの場合は、音声認識を開始できません。");
        }
    }

    // 前の台本を表示するボタンを押したときの処理
    const handlePreviousButton = async () => {
        setCurrentPosition(current_position - 1<0 ? 0 : current_position - 1);
    }

    // 次の台本を表示するボタンを押したときの処理
    const handleNextButton = async () => {
        setCurrentPosition(current_position + 1>sentence_idx_max ? sentence_idx_max : current_position + 1);
    }

    // プロンプターモード切替ボタンを押したときの処理
    const switchPrompterMode = async () => {
        const newMode = !prompterMode;
        setPrompterMode(newMode);
        
        // Pusher API経由でプロンプターモードを切り替え
        const body = { mode: newMode };
        await fetch('/api/pusher/prompter_switch', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    // キーボードイベントのハンドリング
    useEffect(() => {
        const handleKeyDown = (event) => {
            // 入力要素にフォーカスがある場合は無視する
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
                return;
            }

            switch (event.key) {
                case 'ArrowLeft':
                    handlePreviousButton();
                    break;
                case 'ArrowRight':
                    handleNextButton();
                    break;
                case ' ': // Spaceキー
                    event.preventDefault(); // ページのスクロールを防止
                    handleRecognitionButton();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // クリーンアップ関数
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [current_position, isRecognizing, cueCardMord]); // 依存配列に必要な状態を含める

    return (
        <div>
            <h2 className="font-bold text-lg text-gray-700">操作パネル</h2>
            
            {/* 表示モード切替ボタン */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">表示モード切替</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${cueCardMord ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {cueCardMord ? "カンペ" : "ナレーション"}
                    </span>
                </div>
                <button 
                    onClick={() => switchDisplayMode()}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                        cueCardMord 
                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>モードを切り替える</span>
                </button>
                {!cueCardMord ? (
                    <div className="mt-2">
                        <button
                            onClick={switchPrompterMode}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border ${
                                prompterMode
                                    ? 'bg-gray-800 text-white border-gray-900'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>{prompterMode ? "通常表示に戻す" : "プロンプター表示（反転）"}</span>
                        </button>
                    </div>
                ):(null)}
            </div>

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

            {/* スピーカーリスト */}
            <SpeakerList selectedSpeaker={selectedSpeaker} setSelectedSpeaker={setSelectedSpeaker} performers_list={performers_list} />

            {/* グループ設定・解除ボタン */}
            <Grouping script={script} setScript={setScript} groupIndex={groupIndex} setGroupIndex={setGroupIndex} />


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