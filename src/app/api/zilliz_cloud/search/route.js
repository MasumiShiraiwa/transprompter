// 検索専用のPOSTエンドポイント
import { NextResponse } from 'next/server';
import { getMilvusClient, searchData } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

// POST 複雑な検索パラメータでsentenceを検索する
export async function POST(request, context) {
    console.log("Search POST request received");
    const body = await request.json();
    const searchParams = body.data || body;
    
    console.log("Search parameters:", searchParams);
    
    try {
        const client = getMilvusClient();
        const res = await searchData(client, collection_name, searchParams);
        
        return NextResponse.json({ 
            data: res,
            message: 'Search completed successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ 
            error: 'Search failed', 
            details: error.message 
        }, { status: 500 });
    }
}
