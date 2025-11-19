import { NextResponse } from 'next/server';
import { getEmbedding } from '@/app/utils/embedding_server';

export async function POST(request, context) {
    console.log("POST request received");
    const body = await request.json();
    const text_list = body.text_list;

    try{
        const embed_list = await getEmbedding(text_list);
        return NextResponse.json({ message: "Embedding completed successfully", data: embed_list }, { status: 200 });    
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Embedding failed", error: error.message }, { status: 500 });
    }
}
