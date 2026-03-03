// OpenAI APIを使用して、台本を書き換える。
import { NextResponse } from 'next/server';
import { getAzureOpenAIClient, rewriteScript, expandCueCardWithOriginalScript } from '@/app/utils/azure_opai';


export async function PUT(request) {
    const body = await request.json();
    if(!body.data || body.data.previous_scripts===null || body.data.start_position===null || body.data.remain_time===null){
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const {previous_scripts, start_position, remain_time, original_script} = body.data;

    try{
        const client = getAzureOpenAIClient();
        if(!original_script){
            const result = await rewriteScript(client, previous_scripts, start_position, remain_time);
            return NextResponse.json({ message: "Azure OpenAI chat completion completed successfully", data: result }, { status: 200 });
        }else{
            const result = await expandCueCardWithOriginalScript(client, previous_scripts, original_script);
            return NextResponse.json({ message: "Azure OpenAI chat completion completed successfully", data: result }, { status: 200 });
        }


    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Azure OpenAI chat completion failed", error: error.message }, { status: 500 });
    }
}