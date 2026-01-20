"use client"

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/utils/pusher/client';
import { YjsInstance } from '@/app/utils/yjs/client';

export default function YjsClient() {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('loading');
    const [script, setScript] = useState([["Hello", "Goodbye"], ["Hello"]]);
    const [speaker, setSpeaker] = useState(["A","A","B"]);
    const [prompterMode, setPrompterMode] = useState(null);
    const [cueCardMode, setCueCardMode] = useState(null);
    // YJSのインスタンスを保持するためのRef
   
    const yjsInstanceRef = useRef(null);

    useEffect(() => {
        let channel;
        
        const init = async () => {
            // 初期化時に行うこと
            // YJSインスタンスをRefで保持
            // Pusherの同期イベントを受信登録
            // DBとの同期処理(同期updateを適用)→Stateへ反映
            // 
            try {
                // シングルトン的に扱うためにrefで保持
                if (!yjsInstanceRef.current) {
                    yjsInstanceRef.current = new YjsInstance();
                }
                const yjsInstance = yjsInstanceRef.current;
                
                channel = pusherClient
                    .subscribe("private-yjs-update")
                    .bind("evt::yjs-update", async (data) => {
                        console.log("yjs update", data.update);
                        try {
                            const update = data.update;
                            const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
                            const updateUint8 = new Uint8Array(updateArray);
                            
                            // remote update適用
                            await yjsInstance.remoteUpdateHandler(updateUint8);
                            
                            // State更新
                            const newPrompterMode = yjsInstance.getPrompterMode();
                            const newCueCardMode = yjsInstance.getCueCardMode();
                            
                            console.log("Prompter Mode update", newPrompterMode);
                            console.log("Cue Card Mode update", newCueCardMode);
                            
                            if (newPrompterMode !== undefined) setPrompterMode(newPrompterMode);
                            if (newCueCardMode !== undefined) setCueCardMode(newCueCardMode);

                        } catch (e) {
                            console.error("Error applying update", e);
                        }
                    });
                
                setStatus('ready');
                await yjsInstance.sync(); // DBとの同期処理
                console.log("cueCardMode init", yjsInstance.getCueCardMode());
                console.log("prompterMode init", yjsInstance.getPrompterMode());
                console.log("script init", yjsInstance.getScript());
                
                if (yjsInstance.getCueCardMode() !== undefined) setCueCardMode(yjsInstance.getCueCardMode());
                if (yjsInstance.getPrompterMode() !== undefined) setPrompterMode(yjsInstance.getPrompterMode());

            } catch (e) {
                console.error("Failed to load yjs", e);
                setStatus('error');
            }
        };

        init();

        return () => {
            if (channel) channel.unbind();
            if (yjsInstanceRef.current) {
                yjsInstanceRef.current.destroy();
                yjsInstanceRef.current = null;
            }
        };
    }, []);

    async function snapshot() {
        await fetch('/api/yjs/snapshot', {
            method: 'POST',
        });
    }

    // const sendUpdate = async () => {
    //     if (!ydocRef.current || !YRef.current) return;
    //     const ytext = ydocRef.current.getText('test');
    //     ytext.delete(0, ytext.length);
    //     ytext.insert(0, text);
    //     const Y = YRef.current;
    //     const update = Y.encodeStateAsUpdate(ydocRef.current);
    //     
    //     await fetch('/api/yjs/update', {
    //         method: 'POST',
    //         body: JSON.stringify({update: Array.from(update)}),
    //     });
    // }

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex justify-center items-center min-h-screen text-red-500">
                Error loading Yjs
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Yjs Client Control Panel</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm" onClick={() => {snapshot();}}>Snapshot</button>            
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Editor Content</label>
                    <textarea 
                        className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={text} 
                        onChange={(e) => {setText(e.target.value);}} 
                        placeholder="Type something here..."
                    />
                    <div className="mt-2 flex justify-end">
                        <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                            onClick={() => {}}
                        >
                            Send Update
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Cue Card Mode</h2>
                        <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${cueCardMode ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                Status: {cueCardMode ? 'Active' : 'Inactive'}
                            </span>
                            <button 
                                className={`px-4 py-2 rounded-md transition-colors shadow-sm font-medium ${cueCardMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                onClick={() => {
                                    const instance = yjsInstanceRef.current;
                                    if(instance) {
                                        const nextMode = !cueCardMode;
                                        instance.setCueCardMode(nextMode); 
                                        setCueCardMode(nextMode);
                                    }
                                }}
                            >
                                {cueCardMode ? 'Disable' : 'Enable'} Mode
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Prompter Mode</h2>
                        <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${prompterMode ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                Status: {prompterMode ? 'Active' : 'Inactive'}
                            </span>
                            <button 
                                className={`px-4 py-2 rounded-md transition-colors shadow-sm font-medium ${prompterMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                onClick={() => {
                                    const instance = yjsInstanceRef.current;
                                    if(instance) {
                                        const nextMode = !prompterMode;
                                        instance.setPrompterMode(nextMode); 
                                        setPrompterMode(nextMode);
                                    }
                                }}
                            >
                                {prompterMode ? 'Disable' : 'Enable'} Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
