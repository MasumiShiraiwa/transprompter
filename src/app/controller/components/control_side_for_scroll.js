"use client"

import { useState, useEffect } from 'react';
import Grouping from './controll_side_utils/grouping';
import SpeakerList from './controll_side_utils/speaker_list';
import { v4 as uuidv4 } from 'uuid';

export default function ControlSideForScroll({project_id, script, setScript, speaker_list, setSpeakerList, cueCardMode, setCueCardMode, prompterMode, setPrompterMode, isRecognizing, setIsRecognizing, current_position, setCurrentPosition, sentence_idx_max, selectedSpeaker, setSelectedSpeaker, groupId, setGroupId, performers_list, yjsInstance, focus, isScrollBasedCurrentPositionSetting, setIsScrollBasedCurrentPositionSetting, scrollRef}) {

    const id2Index = (id) => {
        let globalIndex = 0;
        for (let group of script) {
            for (let line of group) {
                if (line.id === id) {
                    return globalIndex;
                }
                globalIndex++;
            }
        }
        return null;
    }

    const index2Id = (index) => {
        let globalIndex = 0;
        for (let group of script) {
            for (let line of group) {
                if (globalIndex === index) {
                    return line.id;
                }
                globalIndex++;
            }
        }
        return null;
    }
   // 表示モード切替ボタンを押したときの処理
   const switchDisplayMode= async () => {
    if(isRecognizing){
        alert("音声認識中は表示モードを切り替えられません。");
        return;
    }
    yjsInstance.setCueCardMode(!cueCardMode);
    setCueCardMode(!cueCardMode);
} 

    // プロンプターモード切替ボタンを押したときの処理
    const switchPrompterMode = async () => {
        const newMode = !prompterMode;
        yjsInstance.setPrompterMode(newMode);
        setPrompterMode(newMode);
    }

    // 前の台本を表示するボタンを押したときの処理
    const handlePreviousButton = async () => {
        const currentIdx = id2Index(current_position);
        const nextPos = Math.max(0, currentIdx - 1);

        if(isScrollBasedCurrentPositionSetting){
            const el = scrollRef.current.querySelector(`[data-line-index="${nextPos}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }else{
            setCurrentPosition(index2Id(nextPos));
        }
    }

    // 次の台本を表示するボタンを押したときの処理
    const handleNextButton = async () => {
        // sentence_idx_maxが更新されていない可能性があるため、scriptから計算する
        const flatLength = script ? script.reduce((acc, group) => acc + group.length, 0) : 0;
        const maxIndex = Math.max(0, flatLength - 1);
        const currentIdx = id2Index(current_position);
        const nextPos = Math.min(maxIndex, currentIdx + 1);

        if(isScrollBasedCurrentPositionSetting){
            const el = scrollRef.current.querySelector(`[data-line-index="${nextPos}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }else{
            setCurrentPosition(index2Id(nextPos));
        }
    }

    // キーボードイベントのハンドリング
    useEffect(() => {
        const handleKeyDown = (event) => {
            const target = event.target;
            if (target && target instanceof Element) {
                const isInputLike = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
                    || target.isContentEditable
                    || target.closest('input, textarea, select, [contenteditable="true"]');
                if (isInputLike) return;
            }
            event.preventDefault(); // ページのスクロールを防止


            switch (event.key) {
                case 'ArrowLeft':
                    handlePreviousButton();
                    break;
                case 'ArrowRight':
                    handleNextButton();
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
    }, [current_position]); // 依存配列に必要な状態を含める


    return (
        <div className="flex flex-col h-full">
            <h2 className=" font-bold text-lg text-gray-700">操作パネル</h2>
            
            {/* 表示モード切替ボタン */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">表示モード切替</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${cueCardMode ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {cueCardMode ? "カンペ" : "ナレーション"}
                    </span>
                </div>
                <button 
                    onClick={() => switchDisplayMode()}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                        cueCardMode 
                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>モードを切り替える</span>
                </button>
                {!cueCardMode ? (
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

            {/* 表示位置制御ボタン群 */}
            <div className=" items-center justify-center space-x-4 my-3">
                <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors" aria-label="Scroll"
                onClick={() => setIsScrollBasedCurrentPositionSetting(prev => !prev)}>
                    {isScrollBasedCurrentPositionSetting ? "スクロールをOFFへ" : "スクロールをONへ"}
                </button>
                {/* 左向きボタン */}
                <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors" aria-label="Previous"
                onClick={() => handlePreviousButton()}>
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* 表示位置フォーカスボタン */}
                <button 
                    className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors shadow-lg" 
                >
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2C6.686 2 4 4.686 4 8c0 4.294 5.228 9.22 5.448 9.434a1 1 0 0 0 1.104 0C10.772 17.22 16 12.294 16 8c0-3.314-2.686-6-6-6zm0 9.25A2.25 2.25 0 1 1 10 6.75a2.25 2.25 0 0 1 0 4.5z" clipRule="evenodd" />
                        </svg>
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