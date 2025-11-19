"use client"

import React, { useState } from 'react';

export default function Script( {script, speech} ) {
    return (
        <div className="space-y-6">
            <h2 className='text-2xl font-semibold text-gray-700 mb-4'>Script</h2>

            <div className="bg-gray-50 p-4 rounded-lg">
                <p>{speech}</p>
            </div>
            <div className="min-h-[500px] max-h-[500px] overflow-y-auto bg-gray-50 p-4 rounded-lg">
                {script.map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
        </div>

    )
}