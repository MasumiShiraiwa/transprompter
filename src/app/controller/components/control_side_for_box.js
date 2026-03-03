"use client"

import { useState, useEffect } from 'react';
import Grouping from './controll_side_utils/grouping';
import SpeakerList from './controll_side_utils/speaker_list';
import { v4 as uuidv4 } from 'uuid';

export default function ControlSideForBox({project_id, script, setScript, speaker_list, setSpeakerList, cueCardMode, setCueCardMode, prompterMode, setPrompterMode, isRecognizing, setIsRecognizing, current_position, setCurrentPosition, sentence_idx_max, selectedSpeaker, setSelectedSpeaker, groupId, setGroupId, performers_list, yjsInstance, focus, isTrackingCurrentPosition, setIsTrackingCurrentPosition}) {
    const [newText, setNewText] = useState("");

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

    // 音声認識ボタンを押したときの処理
    const handleRecognitionButton = async () => {
        if (!cueCardMode) { // ナレーションモードの場合は、音声認識を開始する。
            setIsRecognizing(!isRecognizing);
        }else{
            setIsRecognizing(false);
            alert("カンペモードの場合は、音声認識を開始できません。");
        }
    }

    // 前の台本を表示するボタンを押したときの処理
    const handlePreviousButton = async () => {
        const currentIdx = id2Index(current_position);
        const nextPos = Math.max(0, currentIdx - 1);
        setCurrentPosition(index2Id(nextPos));
    }

    // 次の台本を表示するボタンを押したときの処理
    const handleNextButton = async () => {
        // sentence_idx_maxが更新されていない可能性があるため、scriptから計算する
        const flatLength = script ? script.reduce((acc, group) => acc + group.length, 0) : 0;
        const maxIndex = Math.max(0, flatLength - 1);
        const currentIdx = id2Index(current_position);
        const nextPos = Math.min(maxIndex, currentIdx + 1);
        setCurrentPosition(index2Id(nextPos));
    }

    // プロンプターモード切替ボタンを押したときの処理
    const switchPrompterMode = async () => {
        const newMode = !prompterMode;
        yjsInstance.setPrompterMode(newMode);
        setPrompterMode(newMode);
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


    const handleInsertLine = async (globalIdx) => {
        if(globalIdx === null){
            alert("行を選択してください。");
            return;
        }
        if(newText === ""){
            alert("テキストを入力してください。");
            return;
        }
        if(selectedSpeaker === null){
            alert("スピーカーを選択してください。");
            return;
        }
        const newId = uuidv4();

        let tempScript = [...script]
        let newSpeakerList = new Map(speaker_list);
        let currentIndex = 0;
        for(let i = 0; i < tempScript.length; i++){
            let temp = [...tempScript[i]];
            if(currentIndex <= globalIdx && currentIndex + tempScript[i].length > globalIdx){
                temp.splice(globalIdx - currentIndex, 0, {id: newId, text: newText});
                tempScript[i] = temp;
                yjsInstance.updateScript(i, temp);
                break;
            }
            else if(currentIndex + tempScript[i].length === globalIdx){
                yjsInstance.insertScript(i + 1, [{id: newId, text: newText}]);
                tempScript.splice(i + 1, 0, [{id: newId, text: newText}]);
                break;
            }
            currentIndex += tempScript[i].length;
        }
        setScript(tempScript);

        newSpeakerList.set(newId, selectedSpeaker);
        yjsInstance.updateSpeaker(newId, selectedSpeaker);
        setSpeakerList(newSpeakerList);

        setNewText("");
    }

    return (
        <div className="flex flex-col h-full">
            <h2 className=" font-bold text-lg text-gray-700">操作パネル</h2>
            
            {/* 表示モード切替ボタン */}
            <div className="flex-[2] bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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


            {/* グループ設定・解除ボタン */}
            <Grouping script={script} setScript={setScript} groupId={groupId} setGroupId={setGroupId} yjsInstance={yjsInstance} project_id={project_id} />


            {/* 再生制御ボタン群 */}
            <div className="flex-[1] flex items-center justify-center space-x-4 my-3">
                {/* 追跡対象変更ボタン */}
                <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors" aria-label="Scroll"
                onClick={() => setIsTrackingCurrentPosition(prev => !prev)}>
                    {isTrackingCurrentPosition ? "表示位置を追跡中" : "編集位置を追跡中"}
                </button>
                {/* 左向きボタン */}
                <button className="p-3 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors" aria-label="Previous"
                onClick={() => handlePreviousButton()}>
                    <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* 現在位置フォーカスボタン */}
                <button 
                    className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors shadow-lg" 
                    onClick={() => {}}
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

            {/* 割り込みフォーム */}
            <div className=" w-full flex flex-col min-h-0">
                <div className="flex flex-row w-full items-center gap-2 py-2 shrink-0">
                    <button
                        className="flex-shrink-0 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        onClick={() => handleInsertLine(focus.index + 1)}
                    >
                        割り込み
                    </button>
                    {/* スピーカーリスト：入り切らない場合は横スクロールのみ、高さは1行のまま */}
                    <div className="min-w-0 flex-1 overflow-x-auto ">
                        <SpeakerList
                            selectedSpeaker={selectedSpeaker}
                            setSelectedSpeaker={setSelectedSpeaker}
                            props_performers_list={performers_list}
                            noWrap
                        />
                    </div>
                </div>
                <textarea
                    className="w-full h-40 border border-gray-300 rounded-lg p-2 resize-none"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Escape'){
                            e.target.blur();
                        }
                    }}
                />

            </div>

        </div>
    )
}