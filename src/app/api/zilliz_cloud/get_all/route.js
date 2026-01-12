import { NextResponse } from 'next/server';
import { getAllData, getMilvusClient } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

export async function GET() {
    console.log("GET ALL request received: ", collection_name);
    const client = getMilvusClient();
    const all_data = await getAllData(client, collection_name);
    return NextResponse.json({ message: "get all data, successfully", data: all_data }, { status: 200 });
}
