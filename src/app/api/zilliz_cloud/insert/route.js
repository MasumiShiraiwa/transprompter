// ここは、Zilliz cloud内のVDBから、sentenceを操作するAPI
import { NextResponse } from 'next/server';
import { getMilvusClient, insertData, searchData } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

// POST DBにsentenceを追加する
export async function POST(request, context) {
    console.log("POST request received");
    const body = await request.json();
    const data_list = body.data; // 入力時のデータ形式は、オブジェクトの配列で構成される。

    console.log("data_list in post", data_list);

    try{
        const client = getMilvusClient();
        await insertData(client, collection_name, data_list);
        return NextResponse.json({ message: 'Data inserted successfully' }, { status: 200 });
    }catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Data insertion failed' }, { status: 500 });
    }

}

// DELETE DBからsentenceを削除する

// PUT DBのsentenceを更新する