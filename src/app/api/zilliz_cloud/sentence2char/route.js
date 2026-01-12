import { NextResponse } from 'next/server';
import { getMilvusClient, sentence2char } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

export async function POST(request) {
    const body = await request.json();
    const searchParams = body.data || body;

    try{
        const client = getMilvusClient();
        const [char_start_idx, char_end_idx] = await sentence2char(client, collection_name, searchParams);
        return NextResponse.json({ 
            data: [char_start_idx, char_end_idx],
            message: 'Sentence to char completed successfully'
        }, { status: 200 });
    } catch (error) {
        console.error(`コレクション "${collection_name}" でデータを取得できませんでした。`, error);
        return NextResponse.json({  
            error: 'Sentence to char failed',
            details: error.message
        }, { status: 500 });
    }
}