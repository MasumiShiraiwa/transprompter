"use client"

export default function Grouping({script, setScript, groupIndex, setGroupIndex}) {

    // グループ設定ボタンを押したときの処理
    const handleGroupSettings = async () => {
        console.log("script", script);
        const sortedGroupIndex = sortGroupIndex();
        // 念のため連続かどうかを確認する。
        if (!isConsecutive(sortedGroupIndex)) {
            alert("グループに属する行が連続していません。");
            return;
        }

        let newScript = [];
        let currentIndex = 0;
        let tempTargetGroup = [];

        script.forEach(group => {
            if (currentIndex >= sortedGroupIndex[0] && currentIndex <= sortedGroupIndex[sortedGroupIndex.length - 1]){
                tempTargetGroup = tempTargetGroup.concat(group);
                console.log("tempTargetGroup", tempTargetGroup);
                currentIndex += group.length;
                return;
            }else{
                if(tempTargetGroup.length > 0){
                    newScript.push(tempTargetGroup);
                    tempTargetGroup = [];
                }
                newScript.push(group);
                currentIndex += group.length;
                return;
            }
        });
        console.log("newScript", newScript);
        setScript(newScript);
        setGroupIndex([]);

        const body = { script: newScript, speaker_list: null };
        const res_update_script = await fetch('/api/pusher/update_script', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data_update_script = await res_update_script.json();
    }

    // グループ解除ボタンを押したときの処理
    const handleGroupReset = async () => {
        const sortedGroupIndex = sortGroupIndex();
        if (!isGrouped(sortedGroupIndex)) {
            alert("グループに属する行が含まれていません。");
            return;
        }

        let newScript = [];
        let currentIndex = 0;

        // script全体を走査して新しいscriptを構築する
        script.forEach(group => {
            const groupLength = group.length;
            if(groupLength < 2){
                newScript.push(group);
                currentIndex += groupLength;
                return;
            }
            const groupIndices = [];
            for (let j = 0; j < groupLength; j++) {
                groupIndices.push(currentIndex + j);
            }

            // このグループが選択されており(groupIndexに含まれる)場合
            // すべてのインデックスが含まれているかチェックする
            const isTargetGroup = groupIndices.every(idx => sortedGroupIndex.includes(idx));

            if (isTargetGroup) {
                // グループを解除して個別の要素にする
                // ["A", "B"] -> ["A"], ["B"]
                group.forEach(text => {
                    newScript.push([text]);
                });
            } else {
                // そのまま維持
                newScript.push(group);
            }

            currentIndex += groupLength;
        });
        console.log("newScript", newScript);
        setScript(newScript);
        setGroupIndex([]);

        const body = { script: newScript, speaker_list: null };
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
        const sorted = [...arr].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] !== sorted[i-1]+1) {
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
                const groupIndices = [];
                for (let j = 0; j < groupLength; j++) {
                    groupIndices.push(currentIndex + j);
                }

                // arr（groupIndex）がこのグループを完全に含んでいるかチェック
                const isThisGroupIncluded = groupIndices.every(idx => arr.includes(idx));

                if (isThisGroupIncluded) {
                    return true;
                }
            }
            currentIndex += groupLength;
        }
        return false;
    }

    // groupIndexを昇順にソートする
    const sortGroupIndex = () => {
        let arr = [...groupIndex];
        arr.sort((a, b) => a - b);
        setGroupIndex(arr);
        return arr;
    }

    return (
        <div>
            <div className="grid grid-cols-3 gap-2 mt-4">
                <div>
                    {groupIndex.length > 0 ? (
                        <button
                            className="w-full py-2 px-4 rounded-lg font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                            onClick={() => setGroupIndex([])}
                        >
                            選択を解除
                        </button>
                    ) : null}

                </div>
                <div>
                    {isConsecutive(groupIndex) ? (
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
                    {isGrouped(groupIndex) && (
                        <button
                            className="w-full py-2 px-4 rounded-lg font-bold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                            onClick={() => handleGroupReset()}
                        >
                            解除
                        </button>
                    )}
                </div>

                
            </div>

        </div>
    )
}