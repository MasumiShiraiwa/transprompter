"use client"

import { useEffect } from 'react';

export default function Grouping({project_id, script, setScript, groupId, setGroupId, yjsInstance}) {

    // idをglobalIndexに変換する(GroupId用)
    const id2Index = (id) => {
        let globalIndex = 0;
        for(let group of script) {
            for(let line of group) {
                if(line.id === id) {
                    return globalIndex;
                }
                globalIndex++;
            }
        }
        return null;
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            switch(event.key){
                case 'G':
                    handleGroupSettings();
                    break;
                case 'g':
                    handleGroupSettings();
                    break;
                case 'U':
                    handleGroupReset();
                    break;
                case 'u':
                    handleGroupReset();
                    break;
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [groupId])

    // グループ設定ボタンを押したときの処理
    const handleGroupSettings = async () => {
        const sortedGroupId = sortGroupId();
        // 念のため連続かどうかを確認する。
        if (!isConsecutive(sortedGroupId)) {
            return;
        }

        let newScript = [];
        let currentIndex = 0;
        let tempTargetGroup = [];
        let leftGroupIndex = 0;
        let rightGroupIndex = 0;

        script.forEach((group, i) => {

            if (currentIndex >= id2Index(sortedGroupId[0]) && currentIndex <= id2Index(sortedGroupId[sortedGroupId.length - 1])){
                if (tempTargetGroup.length === 0) {
                    leftGroupIndex = i;
                }
                rightGroupIndex = i;
                tempTargetGroup = tempTargetGroup.concat(group);
                currentIndex += group.length;
                return;
            }else{
                if(tempTargetGroup.length > 0){
                    newScript.push(tempTargetGroup);
                    yjsInstance.mergeGroup(leftGroupIndex, rightGroupIndex, tempTargetGroup);
                    tempTargetGroup = [];
                }
                newScript.push(group);
                currentIndex += group.length;
                return;
            }
        });

        if(tempTargetGroup.length > 0){
            newScript.push(tempTargetGroup);
            yjsInstance.mergeGroup(leftGroupIndex, rightGroupIndex, tempTargetGroup);
            tempTargetGroup = [];
        }
        console.log("newScript", newScript);
        setScript(newScript);
        // setGroupId([]);

    }

    // グループ解除ボタンを押したときの処理
    const handleGroupReset = async () => {
        // const sortedGroupId = sortGroupId();
        if (!isGrouped(groupId)) {
            return;
        }

        let newScript = [];
        
        let currentIndex = 0;

        // script全体を走査して新しいscriptを構築する
        script.forEach((group, i) => {
            const groupLength = group.length;
            if(groupLength < 2){
                newScript.push(group);
                currentIndex += groupLength;
                return;
            }
            const groupIds = [];
            for (let j = 0; j < groupLength; j++) {
                groupIds.push(group[j].id);
            }

            // このグループが選択されており(groupIndexに含まれる)場合
            // すべてのインデックスが含まれているかチェックする
            const isTargetGroup = groupIds.every(id => groupId.includes(id));

            if (isTargetGroup) {
                // グループを解除して個別の要素にする
                // ["A", "B"] -> ["A"], ["B"]
                group.forEach(line => {
                    newScript.push([line]);
                });

                yjsInstance.splitGroup(i);
            } else {
                // そのまま維持
                newScript.push(group);
            }

            currentIndex += groupLength;
        });
        console.log("newScript", newScript);
        setScript(newScript);
        setGroupId([]);

        const body = { script: newScript, speaker_list: null, project_id: project_id };
        const res_update_script = await fetch('/api/pusher/update_script', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_update_script = await res_update_script.json();
    }

    // groupIndexが連続した数値かどうかを判定する
    const isConsecutive = (arr) => {
        if (arr.length < 2) return false;
        const sorted = [...arr].sort((a, b) => id2Index(a) - id2Index(b));
        const sortedIndex = sorted.map(id => id2Index(id));
        for (let i = 1; i < sortedIndex.length; i++) {
            if (sortedIndex[i] !== sortedIndex[i-1]+1) {
                return false;
            }
        }
        return true;
    }

    // groupIndexに一つのグループが含まれているかどうかを判定する
    const isGrouped = (arr) => {
        let currentIndex = 0;
        for (let i = 0; i < script.length; i++) {
            const group = script[i];
            const groupLength = group.length;

            // グループ化されている（要素数が2以上）場合のみチェック
            if (groupLength > 1) {
                // 現在のグループのインデックス配列を作成
                const groupIds = [];
                for (let j = 0; j < groupLength; j++) {
                    groupIds.push(group[j].id);
                }

                // arr（groupIndex）がこのグループを完全に含んでいるかチェック
                const isThisGroupIncluded = groupIds.every(id => arr.includes(id));

                if (isThisGroupIncluded) {
                    return true;
                }
            }
            currentIndex += groupLength;
        }
        return false;
    }

    // groupIndexを昇順にソートする
    const sortGroupId = () => {
        let arr = [...groupId];
        arr.sort((a, b) => id2Index(a) - id2Index(b));
        return arr;
    }

    return (
        <div>
            <div className="grid grid-cols-3 gap-2 mt-4">
                <div>
                    {groupId.length > 0 ? (
                        <button
                            className="w-full py-2 px-4 rounded-lg font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                            onClick={() => setGroupId([])}
                        >
                            選択を解除
                        </button>
                    ) : null}

                </div>
                <div>
                    {isConsecutive(groupId) ? (
                        <button
                            className="w-full py-2 px-4 rounded-lg font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            onClick={() => handleGroupSettings()}
                        >
                            グループ設定
                        </button>
                    ) : null}
                </div>
                <div>
                    {/* groupIndexに同じグループに属する行がすべて含まれていたら、グループ解除ボタンを表示する */}
                    {isGrouped(groupId) && (
                        <button
                            className="w-full py-2 px-4 rounded-lg font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                            onClick={() => handleGroupReset()}
                        >
                            グループ解除
                        </button>
                    )}
                </div>

                
            </div>

        </div>
    )
}