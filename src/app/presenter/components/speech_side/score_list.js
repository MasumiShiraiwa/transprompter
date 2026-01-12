"use client"

import { useMemo } from 'react';

export default function ScoreList({ scoreList, weighList, rawScoreList }) {
    // データ変換: オブジェクトを配列にしてインデックス順にソート
    const data = useMemo(() => {
        if (!scoreList) return [];
        return Object.entries(scoreList)
            .map(([key, value]) => ({
                idx: parseInt(key, 10),
                score: value.score || 0,
                weigh: (weighList && weighList[key]?.score) || 0,
                rawScore: (rawScoreList && rawScoreList[key]?.score) || 0,
                sentence_idx: value.sentence_idx
            }))
            .sort((a, b) => a.idx - b.idx);
    }, [scoreList, weighList, rawScoreList]);

    // sentence_idx の境界を取得してX軸ラベル用データを作成
    const sentenceBoundaries = useMemo(() => {
        const bounds = [];
        let lastSentIdx = null;
        data.forEach(d => {
            if (d.sentence_idx !== undefined && d.sentence_idx !== lastSentIdx) {
                bounds.push({ idx: d.idx, sentIdx: d.sentence_idx });
                lastSentIdx = d.sentence_idx;
            }
        });
        return bounds;
    }, [data]);

    // 表示用に間引き（重なり防止）
    const xLabels = useMemo(() => {
        if (sentenceBoundaries.length === 0) return [];
        // グラフ幅に応じて表示数を制限（例: 最大10個程度）
        const maxTicks = 10;
        if (sentenceBoundaries.length <= maxTicks) return sentenceBoundaries;
        
        const step = Math.ceil(sentenceBoundaries.length / maxTicks);
        return sentenceBoundaries.filter((_, i) => i % step === 0);
    }, [sentenceBoundaries]);

    if (data.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                データ待機中...
            </div>
        );
    }

    // グラフの描画サイズ設定
    const height = 150;
    const padding = 32; // scoreラベルのため少し余裕を増やす
    const axisLabelWidth = 38; // y軸ラベルエリア

    // スケール計算
    const allValues = data.flatMap(d => [d.score, d.weigh, d.rawScore]);
    const maxScore = Math.max(...allValues, 1); // 最低でも1
    const minScore = Math.min(...allValues, 0);
    const minIdx = data[0].idx;
    const maxIdx = data[data.length - 1].idx;
    const rangeIdx = maxIdx - minIdx || 1;

    // 座標計算関数
    const getY = (score) => height - padding - ((score - minScore) / (maxScore - minScore || 1)) * (height - padding * 2);

    // SVGのPolyline用ポイント列を作成
    const getPoints = (key) => data.map((d) => {
        const x = axisLabelWidth + ((d.idx - minIdx) / rangeIdx) * 1000;
        return `${x},${getY(d[key])}`;
    }).join(' ');

    const pointsScore = getPoints('score');
    const pointsWeigh = getPoints('weigh');
    const pointsRawScore = getPoints('rawScore');

    // 縦軸目盛用（例: 0%, 25%, 50%, 75%, 100%）とスコアラベル
    const yTicksCount = 4;
    const yTicks = Array.from({length: yTicksCount + 1}, (_, i) => i / yTicksCount);
    const yLabels = yTicks.map(ratio => {
        const scoreValue = (maxScore - minScore) * (1 - ratio) + minScore;
        const rounded = Math.round(scoreValue * 100) / 100;
        return { 
            score: rounded, 
            y: getY(scoreValue)
        };
    });

    return (
        <div className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">スコア推移</h3>
                <div className="flex space-x-3 text-xs">
                    <div className="flex items-center"><span className="w-3 h-1 bg-blue-500 mr-1"></span>Score</div>
                    <div className="flex items-center"><span className="w-3 h-1 bg-green-500 mr-1"></span>Weigh</div>
                    <div className="flex items-center"><span className="w-3 h-1 bg-red-500 mr-1"></span>Raw</div>
                </div>
            </div>
            <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
                <svg 
                    width="100%" 
                    height="100%" 
                    viewBox={`0 0 ${1000 + axisLabelWidth} ${height}`} 
                    preserveAspectRatio="none"
                    className="overflow-visible"
                >
                    {/* 縦軸スコア目盛・ラベル */}
                    {/* y目盛線 */}
                    {yLabels.map(({score, y}, i) => (
                        <g key={i}>
                            {/* グリッド線 (x=axisLabelWidthから右へ) */}
                            <line 
                                x1={axisLabelWidth} x2={axisLabelWidth + 1000}
                                y1={y} y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="1" 
                                strokeDasharray="4 4"
                            />
                            {/* y軸のラベル */}
                            <text
                                x={axisLabelWidth - 8}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="12"
                                fill="#9ca3af"
                            >
                                {score}
                            </text>
                        </g>
                    ))}

                    {/* Weigh Graph (Green) */}
                    <polyline
                        fill="none"
                        stroke="#22c55e" // green-500
                        strokeWidth="2"
                        points={pointsWeigh}
                        vectorEffect="non-scaling-stroke" 
                        strokeOpacity="0.7"
                    />

                    {/* Raw Score Graph (Red) */}
                    <polyline
                        fill="none"
                        stroke="#ef4444" // red-500
                        strokeWidth="2"
                        points={pointsRawScore}
                        vectorEffect="non-scaling-stroke" 
                        strokeOpacity="0.7"
                    />

                    {/* 折れ線グラフ (Score - Main) */}
                    <polyline
                        fill="none"
                        stroke="#3b82f6" // blue-500
                        strokeWidth="2"
                        points={pointsScore}
                        vectorEffect="non-scaling-stroke" 
                    />

                    {/* エリア塗りつぶし (Scoreのみ) */}
                    <polygon
                        fill="url(#gradient)"
                        opacity="0.2"
                        points={`${axisLabelWidth},${height} ${pointsScore} ${axisLabelWidth + 1000},${height}`}
                    />

                    {/* y軸線 */}
                    <line
                        x1={axisLabelWidth}
                        y1={padding}
                        x2={axisLabelWidth}
                        y2={height - padding}
                        stroke="#9ca3af"
                        strokeWidth="1"
                    />

                    {/* X軸（Sentence Index）目盛りとラベル */}
                    {xLabels.map((label, i) => {
                        const x = axisLabelWidth + ((label.idx - minIdx) / rangeIdx) * 1000;
                        return (
                            <g key={i}>
                                {/* 目盛り線 */}
                                <line
                                    x1={x} x2={x}
                                    y1={height - padding} y2={height - padding + 5}
                                    stroke="#9ca3af"
                                    strokeWidth="1"
                                />
                                {/* ラベル */}
                                <text
                                    x={x}
                                    y={height - padding + 18}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#9ca3af"
                                >
                                    {label.sentIdx}
                                </text>
                            </g>
                        );
                    })}

                    {/* グラデーション定義 */}
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                    </defs>
                </svg>
                
                {/* 軸ラベル */}
                <div className="absolute bottom-0 right-0 text-xs text-gray-400 mr-2">Sentence Idx</div>
                <div className="absolute top-1 left-0 text-xs text-gray-400" style={{width: `${axisLabelWidth - 4}px`, textAlign: "right"}}>
                  Score
                </div>
            </div>
        </div>
    );
}
