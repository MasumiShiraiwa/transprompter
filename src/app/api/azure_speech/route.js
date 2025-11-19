/**
 * Azure Speech Service認証トークン取得API
 * 
 * 使用方法:
 * GET /api/azure_speech
 * 
 * レスポンス例:
 * {
 *   "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
 *   "region": "japaneast"
 * }
 */

import axios from 'axios';

// Next.js App Router形式のAPIエンドポイント（GETリクエスト用）
export async function GET(request) {
    // 環境変数からAzure Speech Serviceの設定を取得
    const speechKey = process.env.SPEECH_KEY;     // Azure Speech Serviceのサブスクリプションキー
    const speechRegion = process.env.SPEECH_REGION; // Azure Speech Serviceのリージョン（例: japaneast）
    
    // 環境変数が設定されているかチェック
    if (!speechKey || !speechRegion || 
        speechKey === 'paste-your-speech-key-here' || 
        speechRegion === 'paste-your-speech-region-here') {
        return new Response(
            JSON.stringify({ error: 'Speech keyまたはregionが.envファイルに設定されていません。' }), 
            { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Azure Speech Service APIに送信するためのヘッダー設定
    const headers = { 
        'Ocp-Apim-Subscription-Key': speechKey,     // Azure認証用のサブスクリプションキー
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
        // Azure Speech ServiceのSTS（Security Token Service）から認証トークンを取得
        const tokenResponse = await axios.post(
            `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, 
            null,  // ボディは空（GETのような感じでPOST）
            { headers }
        );

        // 成功時のレスポンス - トークンとリージョンを返す
        return new Response(
            JSON.stringify({ 
                token: tokenResponse.data,  // Azure Speech SDKで使用する認証トークン
                region: speechRegion        // Speech SDKで必要なリージョン情報
            }), 
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (err) {
        // エラーログを出力（開発時のデバッグ用）
        console.error('Azure Speech APIエラー:', err.response?.data || err.message);
        
        // エラー時のレスポンス
        return new Response(
            JSON.stringify({ error: 'Speech keyの認証エラーが発生しました。' }), 
            { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}