"use client"

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export default function Canvas( ) {

    const [canvas, setCanvas] = useState(null);
    const canvasElementRef = useRef(null);
    
    // 履歴用
    const [histories, setHistories] = useState({undo: [], redo: []});

    const BACKGROUND_COLOR = "white"; // "#364f6b";
    const CANVAS_HEIGHT = 108 * 3;
    const CANVAS_WIDTH = 192 * 3;

    useEffect(() => {
        if (canvasElementRef.current) {
            const canvas = new fabric.Canvas(canvasElementRef.current, {
                backgroundColor: BACKGROUND_COLOR,
            });
            setCanvas(canvas);
            canvas.requestRenderAll();

            // 手書きブラシを設定
            const pencil = new fabric.PencilBrush(canvas);

            canvas.freeDrawingBrush = pencil; // 手書きブラシを設定
            canvas.freeDrawingBrush.color = 'black';
            canvas.freeDrawingBrush.width = 10;
            canvas.isDrawingMode = true; // 手書きモードを有効にする
            
            // 履歴用
            // 初期状態を履歴に追加
            setHistories({undo: [canvas.toJSON()], redo: []});

            // 履歴追加関数
            const onAddHistory = (event) => {
                const targetCanvas = event.target.canvas;
                if(targetCanvas) {
                    setHistories((prev) => ({
                        undo: [...prev.undo, targetCanvas.toJSON()],
                        redo: [],
                    }));
                }
            };

            canvas.on("object:added", onAddHistory);

            return() => {
                canvas.dispose();
                canvas.off("object:added", onAddHistory);
            }
        }else{
            return;
        };
    }, []);

    
    const onIncreaseBrushWidth = () => { // stateで管理
        if(canvas) {
            canvas.freeDrawingBrush.width = Math.min(canvas.freeDrawingBrush.width + 5, 50);
        }
    }

    const onDecreaseBrushWidth = () => {
        if(canvas) {
            canvas.freeDrawingBrush.width = Math.max(canvas.freeDrawingBrush.width - 5, 5);
        }
    }

    const onClearClick = () => {
        if(canvas) {
            canvas.clear();
            canvas.backgroundColor = BACKGROUND_COLOR;
            canvas.requestRenderAll();
            setHistories( prev => ({undo: [...prev.undo, canvas.toJSON()], redo: []}));
        }
    }

    const onUndoClick = async () => {
        if(canvas && histories.undo.length > 1) {

            await canvas.loadFromJSON(histories.undo[histories.undo.length - 2]);
            canvas.renderAll();
            const newRedo = [...histories.redo, histories.undo[histories.undo.length - 1]];
            const newUndo = histories.undo.slice(0, -1);
            setHistories({undo: newUndo, redo: newRedo});
        }
    }

    const onRedoClick = async () => {
        if(canvas && histories.redo.length > 0) {
            await canvas.loadFromJSON(histories.redo[histories.redo.length - 1]);
            canvas.renderAll();
            const newUndo = [...histories.undo, histories.redo[histories.redo.length - 1]];
            const newRedo = histories.redo.slice(0, -1);
            setHistories({undo: newUndo, redo: newRedo});
        }
    }

    const toJPEG = () => {
        if (!canvas) return;
        const image = canvas.toDataURL({
            format: 'jpeg',
            quality: 0,
        });
        canvas.clear();
        canvas.backgroundColor = BACKGROUND_COLOR;
        canvas.requestRenderAll();

        setHistories((prev) => ({
            undo: [canvas.toJSON()],
            redo: [],
        }));
        return image;
    }

    
    const sendCueCard = async () => {
        const cue_card = toJPEG();
        if(!cue_card) return;
        const body = {cueCard: cue_card};
        let res = await fetch('/api/pusher/send_handwrite_cue_card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        let data = await res.json();
        if(res.status === 500){
            alert("データサイズが大きすぎます");
        }
        console.log("data", data);
    }


    return (
        <div className="flex flex-col h-full w-full bg-gray-200 p-4 rounded-lg items-center overflow-hidden">

            <div className="relative flex-1 w-full flex items-center justify-center mb-2 min-h-0 overflow-hidden">
                <div className="aspect-video h-full max-h-full w-auto max-w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <canvas 
                        id="canvas" 
                        ref={canvasElementRef}
                        height={CANVAS_HEIGHT}
                        width={CANVAS_WIDTH}
                        style={{width: '100%', height: '100%', objectFit: 'contain'}}
                    />
                </div>
            </div>
            
            {/* Control Bar - Canvasの幅に合わせるため、max-wを設定するか、コンテナいっぱいに広げる */}
            <div className="h-fit w-full max-w-screen-lg flex items-center justify-between gap-4 p-2 bg-white rounded-lg shadow-sm">
                {/* Brush Size Controls */}
                <div className="flex flex-col gap-1">
                    <button 
                        onClick={onIncreaseBrushWidth}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        title="ブラシサイズを大きく"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button 
                        onClick={onDecreaseBrushWidth}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        title="ブラシサイズを小さく"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* History Controls */}
                <div className="flex items-center gap-2 border-l border-r border-gray-200 px-4">
                    <button 
                        onClick={onUndoClick}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        title="元に戻す"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button 
                        onClick={onRedoClick}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        title="やり直す"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onClearClick}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        クリア
                    </button>
                    <button 
                        onClick={sendCueCard}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        送信
                    </button>
                </div>
            </div>
        </div>
    )
}