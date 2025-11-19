"use client"

import { useState } from 'react';
import ScriptSide from './script_side';
import SpeechSide from './speech_side';

export default function Layout( {scripts} ) {
    const [current_position, setCurrentPosition] = useState(0);

    return (
        <div className="flex h-screen py-4 px-2 space-x-2">
            <div className="flex-[7] min-w-0">
                <ScriptSide scripts={scripts} current_position={current_position} />
            </div>
            <div className="flex-[3] min-w-0">
                <SpeechSide setCurrentPosition={setCurrentPosition} />
            </div>
        </div>
    )

}