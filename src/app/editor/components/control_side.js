"use client"

import { useState, useEffect } from 'react';
import SpeakerList from './controll_side_utils/speaker_list';
import Grouping from './controll_side_utils/grouping';
import { YjsInstance } from '@/app/utils/yjs/client';

export default function ControlSide({project_id, script, setScript, cueCardMord, setCueCardMord, prompterMode, setPrompterMode, isRecognizing, setIsRecognizing, current_position, setCurrentPosition, sentence_idx_max, selectedSpeaker, setSelectedSpeaker, onSpeakerListSelect, groupId, setGroupId, performers_list, yjsInstance}) {

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


    return (
        <div>
            <h2 className="font-bold text-lg text-gray-700">操作パネル</h2>
            
            {/* スピーカーリスト */}
            <SpeakerList project_id={project_id} selectedSpeaker={selectedSpeaker} onSpeakerListSelect={onSpeakerListSelect} props_performers_list={performers_list} />

            {/* グループ設定・解除ボタン */}
            <Grouping project_id={project_id} script={script} setScript={setScript} groupId={groupId} setGroupId={setGroupId} yjsInstance={yjsInstance} />
        </div>
    )
}