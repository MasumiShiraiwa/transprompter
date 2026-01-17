"use client"

export default function SpeakerList( {selectedSpeaker, setSelectedSpeaker, performers_list} ) {
    
    return (
        <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2">Speaker List</h2>
            <div className="flex flex-wrap gap-2">
                {performers_list.map((speaker, index) => (
                    <button
                        key={index}
                        className={`px-4 py-2 font-medium rounded-lg border shadow-sm transition-colors duration-200 text-sm
                            border-gray-400
                            ${selectedSpeaker === speaker
                                ? 'bg-gray-300 text-gray-800 ring-2 ring-gray-200' // 選択時: 濃いグレー背景＋白文字＋外枠強調
                                : 'bg-white text-gray-800 hover:bg-gray-200 hover:text-black'
                            }`}
                        onClick={() => setSelectedSpeaker(speaker)}
                    >
                        {speaker}
                    </button>
                ))}
            </div>
        </div>
    )
}