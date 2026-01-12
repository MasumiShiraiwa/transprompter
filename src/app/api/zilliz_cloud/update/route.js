import { NextResponse } from 'next/server';
import { deleteData, getAllDataID, getMilvusClient, insertData } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

export async function PUT(request) {
    console.log("PUT request received: ", collection_name);
    const body = await request.json();
    const data_list = body.data;
    try{
        const client = getMilvusClient();
        const all_id_list = await getAllDataID(client, collection_name);
        const res_delete = await deleteData(client, collection_name, all_id_list);
        const res_insert = await insertData(client, collection_name, data_list);
        return NextResponse.json({ message: "Embedding updated successfully" }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Embedding update failed", error: error.message }, { status: 500 });
    }
}
