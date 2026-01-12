import { NextResponse } from 'next/server';
import { getMilvusClient, char2sentence } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

export async function POST(request) {
    const body = await request.json();
    const searchParams = body.data || body;

    try{
        const client = getMilvusClient();
        const sentence_idx = await char2sentence(client, collection_name, searchParams);
        return NextResponse.json({ 
            data: sentence_idx,
            message: 'Char to sentence completed successfully'
        }, { status: 200 });
    } catch (error) {
        console.error(`コレクション "${collection_name}" でデータを取得できませんでした。`, error);
        return NextResponse.json({  
            error: 'Char to sentence failed',
            details: error.message
        }, { status: 500 });
    }
}