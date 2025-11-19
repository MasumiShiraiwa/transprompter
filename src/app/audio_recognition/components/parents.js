"use client"

import Speech2txt from './speech2txt';
import Script from './script';
import { useState } from 'react';

export default function Parents( {script} ) {
    const [speech, setSpeech] = useState('');

    return (
        
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Ptompter demo app</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Speech2txt setSpeech={setSpeech} />
                <Script script={script} speech={speech} />
            </div>
        </div>
    )
}