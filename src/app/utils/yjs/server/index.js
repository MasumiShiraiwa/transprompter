import * as Y from 'yjs';

// サーバーサイドでシングルトンとしてY.Docインスタンスを保持する
// 注意: Next.jsのサーバーレス環境では、リクエスト間でインスタンスが永続化される保証はありません。
// 必要に応じてRedisやデータベース等の永続化層と連携してください。

const globalForYjs = global;

if (!globalForYjs.ydoc) {
    globalForYjs.ydoc = new Y.Doc();
}

export const ydoc = globalForYjs.ydoc;
