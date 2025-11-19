import { NextResponse } from 'next/server';
import { deleteData, getAllData, getMilvusClient } from '@/app/utils/zilliz_cloud';

const collection_name = process.env.ZILLIZ_COLLECTION_NAME;

export async function DELETE(request) {
    console.log("DELETE request received");
    const body = await request.json();
    try{
        const client = getMilvusClient();
        const all_id_list = await getAllData(client, collection_name);
        const res = await deleteData(client, collection_name, all_id_list);
        console.log("res", res.message);
        return NextResponse.json({ message: "Embedding deleted successfully" }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Embedding deletion failed", error: error.message }, { status: 500 });
    }
}
