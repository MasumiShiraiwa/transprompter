// LLMの結果から、文章位置を推定する。
export const predictPositionByLLM = async (new_speech, speech_history, previous_position, script) => {

    const response = await fetch('/api/azure_openai/estimate_sentence_position', {
        method: 'PUT',
        body: JSON.stringify({
            data: {
                new_speech: new_speech.text,
                speech_history: speech_history,
                previous_position: previous_position,
                script: script,
            },
        }),
    });
    let data = await response.json();
    data = JSON.parse(data.data);

    if (!new_speech.isSentenceCompleted) {
        data.new_speech = "";
    }

    data.position = parseInt(data.position);

    return data; // {"position": "...", "new_speech": "..."}
}



// ベクトル空間上の類似度探索の結果から、総合的に台本の文章位置を推定する。
export const predictPositionByVector = async (score_list, setScoreList, search_results_lists, pre_sentence_idx, sentence_idx_max, setWeighList, setRawScoreList) => {
    console.log("search_results_lists:", search_results_lists[0]);

    // {char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
    setScoreList(prev => {
        const next = { ...prev }; // ←コピー
        for (let char_idx in next) {
            next[char_idx].score = 0;
        }
        return next;
    });

    // 後で消す  
    const current_char_indices = Object.keys(score_list)
        .filter(idx => score_list[idx].sentence_idx === pre_sentence_idx)
        .map(idx => Number(idx));

    const current_char_start_idx = Math.min(...current_char_indices);
    const current_char_end_idx = Math.max(...current_char_indices);
    const current_char_idx = (current_char_end_idx + current_char_start_idx) / 2;
    setWeighList(prev => {
        const next = { ...prev }; // ←コピー
        for (let char_idx in next) {
            next[char_idx].score = weight_function(current_char_idx, char_idx, 1*20, 5*20, 0.01, 0.08);
        }
        return next;
    });
    // ここまで、後で消す


    const {next_score_list, next_search_results_lists} = generateScoreListFromSearchResults(score_list, search_results_lists, pre_sentence_idx); //predict time[ms] 1366.299999952316
    // score_list =  await getScoreListFromPrePosition(score_list, pre_sentence_idx, sentence_idx_max); // これが入ると、predict time[ms] 1335.9000000953674 変わらん
    setScoreList(next_score_list);

    // スコアが最も高い文字Idxを取得する。
    const sentence_idx = getMaxSentenceIdx(next_search_results_lists);
    if (sentence_idx === null) {
        return pre_sentence_idx;
    }
    // let argmax_char_idx = argmaxObject(next_score_list);

    // 推定時間(2sなど)分のバッファを取る場合(1s=5文字目安)
    // console.log("argmax_char_idx", argmax_char_idx, "score: ", next_score_list[argmax_char_idx].score);
    // argmax_char_idx = String(parseInt(argmax_char_idx) + 5 * 2);
    
    // const sentence_idx = score_list[argmax_char_idx].sentence_idx;

    return sentence_idx;
}

const generateScoreListFromSearchResults = (score_list, search_results_lists, pre_sentence_idx, alpha = 0.01, beta = 0.08) => {
    let next_score_list = { ...score_list };
    // current sentence
    // score_list: {char_idx1: {score:, sentence_idx:}, char_idx2: {score:, sentence_idx:}, ...}
    // 指定されたsentence_idxのchar_idxのリストを抽出
    const current_char_indices = Object.keys(next_score_list)
        .filter(idx => next_score_list[idx].sentence_idx === pre_sentence_idx)
        .map(idx => Number(idx));

    const current_char_start_idx = Math.min(...current_char_indices);
    const current_char_end_idx = Math.max(...current_char_indices);
    const current_char_idx = (current_char_end_idx + current_char_start_idx) / 2;




    for (const search_results of search_results_lists) {
        // console.log("search_results", search_results);
        for (const result of search_results) {
            let total_score = 0;
            for (let i = result.char_start_idx; i <= result.char_end_idx; i++) {
                let new_score = result.score * weight_function(current_char_idx, i, 1*20, 5*20, alpha, beta)
                total_score += new_score;
                if (next_score_list.hasOwnProperty(i)) {
                    next_score_list[i] = {
                        ...next_score_list[i],
                        score: next_score_list[i].score < new_score ? new_score : next_score_list[i].score
                    };
                } else {
                    next_score_list[i] = {
                        score: new_score,
                        sentence_idx: result.sentence_idx
                    };
                }
            }
            // result.char_start_idx から result.char_end_idx までの score の平均を計算して result.score に代入
            // ※ search_results の値（各 result のプロパティ）は直接書き換える
            const new_score = total_score / (result.char_end_idx - result.char_start_idx + 1);
            Object.assign(result, { score: new_score });
        }
        console.log("search_results_lists:", search_results_lists);
    }
    console.log("next_score_list:", next_score_list);


    
    return {next_score_list, next_search_results_lists: search_results_lists};
}

function getMaxSentenceIdx(search_results_lists, top_k = 5, top_1_threshold = 0.5, var_threshold = 0.05) {
    for (const search_results of search_results_lists) {
        const maxResult = search_results.reduce((prev, current) => (prev.score > current.score ? prev : current), search_results[0]);
        if (maxResult.score > top_1_threshold) {
            // scoreがtop_1_threshold以上のものだけを抽出する
            const topK = search_results.filter(result => result.score >= top_1_threshold);
            console.log("topK:", topK);
            // Calculate variance manually since Math.var does not exist
            const scores = topK.map(result => result.score);
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            let var_score = scores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / scores.length;
            if (var_score > var_threshold) {
                console.log("var_score is too high, return the first sentence_idx", var_score);
                return search_results[0].sentence_idx;
            }else{
                console.log("var_score is low, return the weighted sentence_idx", var_score);
                // result.scoreを正規化した重みとしてかけ合わせ、result_sentence_idxを算出
                const scores = topK.map(result => result.score);
                const score_sum = scores.reduce((a, b) => a + b, 0);
                // 安全のためゼロ除算対応
                if (score_sum === 0) {
                    return topK[0].sentence_idx;
                }
                const weighted_sum = topK.reduce((acc, result) => acc + result.sentence_idx * (result.score / score_sum), 0);
                return Math.round(weighted_sum);
            }
        }
    }
    console.log("no sentence_idx found");
    return null;

}

function argmaxObject(scoreList) {
    let maxScore = -Infinity;
    let maxKey = null;
  
    for (const key in scoreList) {
      if (!Object.prototype.hasOwnProperty.call(scoreList, key)) continue;
  
      const score = scoreList[key].score;
      if (score > maxScore) {
        maxScore = score;
        maxKey = key; // key は string
      }
    }
  
    return maxKey;
  }

function weight_function(current_char_idx, target_char_idx, left_max, right_max, alpha = 0.995, beta = 0.900) {
    const left = current_char_idx - left_max;
    const right = current_char_idx + right_max;
    if (target_char_idx >= left && target_char_idx <= right) {
        return 1.0;
    }
    if (right <= target_char_idx) {
        return Math.exp(-alpha * (target_char_idx - right));
    } else {
        return Math.exp(-beta * (left - target_char_idx));
    }
}

