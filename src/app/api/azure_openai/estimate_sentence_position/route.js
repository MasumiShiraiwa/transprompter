import { NextResponse } from 'next/server';
import { getAzureOpenAIClient, estimatePosition } from '@/app/utils/azure_opai';


export async function PUT(request) {
    const body = await request.json();
    const data_list = body.data;
    // console.log("data_list", data_list);

    try{
        const client = getAzureOpenAIClient();
        const result = await estimatePosition(client, data_list.new_speech, data_list.speech_history, data_list.previous_position, data_list.script);

        return NextResponse.json({ message: "Azure OpenAI chat completion completed successfully", data: result }, { status: 200 });
    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Azure OpenAI chat completion failed", error: error.message }, { status: 500 });
    }
}