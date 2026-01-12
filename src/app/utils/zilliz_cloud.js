import { MilvusClient, ConsistencyLevelEnum } from '@zilliz/milvus2-sdk-node';
import assert from 'assert';

const uri = process.env.ZILLIZ_URI;
const token = process.env.ZILLIZ_TOKEN;

// API機能から各関数を呼び出す。
// Milvusクライアントを作成
export const getMilvusClient = () => {
    try {
        const client = new MilvusClient({
            address:uri,
            token:token,
        });
        console.log('Milvusクライアントを作成しました。');
        return client;
    } catch (error) {
        console.error('Milvusクライアントを作成できませんでした。', error);
        throw error;
    }
}

// データを挿入
export const insertData = async (client, collection_name, data_list) => {
    for (const data of data_list) {
        assert(data.vector.length === 384, 'ベクトルの長さが384ではありません'+data.vector.length);
        assert(data.sentence !== undefined, 'sentenceがundefinedです');
        assert(data.sentence_idx !== undefined, 'sentence_idxがundefinedです');
        assert(data.char_start_idx !== undefined, 'char_start_idxがundefinedです');
        assert(data.char_end_idx !== undefined, 'char_end_idxがundefinedです');
    }
    
    try {
        const res = await client.insert({
            collection_name,
            data: data_list,
        });

        if (res?.err_index?.length > 0 ){
            const { error_code, reason } = res.status || {};
            console.error(`コレクション "${collection_name}" にデータを挿入できませんでした。`, error_code, reason);
            throw new Error(`Insert failed: [${error_code}]: ${reason}`);
        }

        console.log(`コレクション "${collection_name}" にデータを挿入しました。`, res);
    } catch (error) {
        // console.error(`コレクション "${collection_name}" にデータを挿入できませんでした。`, error);
        throw error;
    }
}

// データを検索
export const searchData = async (client, collection_name, searchParams) => {
    // パラメータ
    const query_vector = searchParams.vector;
    assert(query_vector.length === 384, 'ベクトルの長さが384ではありません');
    // optional parameter
    const output_fields = searchParams.output_fields || ['*'];
    const limit = searchParams.limit || 10;
    const metric_type = searchParams.metric_type || 'COSINE'; //　大文字

    try {
        const res = await client.search({
            collection_name,
            vector: query_vector,
            output_fields,
            limit,
            metric_type,
        });
        console.log(`コレクション "${collection_name}" でデータ検索を実行しました。`);
        return res;
    } catch (error) {
        console.error(`コレクション "${collection_name}" でデータ検索を実行できませんでした。`, error);
        throw error;
    }
}

// 特定のデータを削除
export const deleteData = async (client, collection_name, id_list) => {
    try{
        const res = await client.delete({
            collection_name,
            ids: id_list,
        });

        return res;
    } catch (error) {
        console.error(`コレクション "${collection_name}" でデータ"${id_list}"を削除できませんでした。`, error);
        throw error;
    }
}

// すべてのデータを取得
export const getAllDataID = async (client, collection_name) => {
    try{
        const res = await client.query({
            collection_name: collection_name,
            filter: "primary_key > 0",  // 条件なしならすべて取得
            output_fields: ["*"],
          });
          return res.data.map(item => item.primary_key);
    } catch (error) {
        console.error(`コレクション "${collection_name}" で全データIDを取得できませんでした。`, error);
        throw error;
    }
}

// すべてのデータを取得
export const getAllData = async (client, collection_name) => {
    try{
        const res = await client.query({
            collection_name: collection_name,
            filter: "primary_key > 0",  // 条件なしならすべて取得
            output_fields: ["*"],
          });
          return res.data;
    } catch (error) {
        console.error(`コレクション "${collection_name}" で全データを取得できませんでした。`, error);
        throw error;
    }
}



// Indexの作成って必要？クラウド上で終わっている？確認できるメソッドはあるかな。
// export const createIndex = 

// export const flashCollection = async (client, collection_name) => {
//     try {
//         // await client.flushSync({ collection_names: [collection_name] });ではないの？
//         await client.flashCollection({
//             collection_name,
//         });
//         console.log(`コレクション "${collection_name}" をフラッシュしました。`);
//     } catch (error) {
//         console.error(`コレクション "${collection_name}" をフラッシュできませんでした。`, error);
//         throw error;
//     }
// }


// 文字Idxから文章Idxを取得
export const char2sentence = async (client, collection_name, searchParams) => {
    
    const filter = searchParams.filter; // 例: "char_start_idx <= XXX AND char_end_idx >= XXX"
    assert(filter !== undefined, 'filterがundefinedです');
    const output_fields = searchParams.output_fields || ['*'];

    try{
    const res = await client.query({
        collection_name,
        filter,
        output_fields,
        limit: 1
    });
    return res.data[0].sentence_idx;
    } catch (error) {
        console.error(`コレクション "${collection_name}" でデータを取得できませんでした。`, error);
        throw error;
    }
}

// 文章Idxから文字Idxを取得
export const sentence2char = async (client, collection_name, searchParams) => {
    const filter = searchParams.filter; // 例: "char_start_idx <= XXX AND char_end_idx >= XXX"
    assert(filter !== undefined, 'filterがundefinedです');
    const output_fields = searchParams.output_fields || ['*'];
    const limit = searchParams.limit || 1;

    try{
        const res = await client.query({
            collection_name,
            filter,
            output_fields,
            limit,
        });

        console.log("sentence2char res", res.data);
        
        const char_start_idx = res.data[0].char_start_idx;
        const char_end_idx = res.data[0].char_end_idx;
        return [char_start_idx, char_end_idx];
    } catch (error) {
        console.error(`コレクション "${collection_name}" でデータを取得できませんでした。`, error);
        throw error;
    }

}
