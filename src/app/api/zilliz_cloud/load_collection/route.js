// 検索専用のPOSTエンドポイント
import { NextResponse } from 'next/server';
import { getMilvusClient, searchData } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

// GET Collectionをロードする
export async function GET(request, context) {
    try {
        const client = getMilvusClient();
        await client.loadCollection({ 
            collection_name: collection_name,
            load_fields: ["primary_key", "vector", "sentence_idx", "char_start_idx", "char_end_idx"],
            skip_load_dynamic_field: true // ダイナミックフィールドのロードをスキップ(デフォルトはfalse)
         });

        const loadState = await client.getLoadState({
            collection_name: collection_name,
        })
        
        console.log("loadState", loadState);

        return NextResponse.json({ message: 'Collection loaded successfully', loadState: loadState }, { status: 200 });
    } catch (error) {
        console.error('Collection load error:', error);
        return NextResponse.json({ message: 'Collection load failed', error: error.message }, { status: 500 });
    }
}
