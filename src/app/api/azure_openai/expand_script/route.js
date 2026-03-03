// OpenAI APIを使用して、台本を書き換える。
import { NextResponse } from 'next/server';
import { getAzureOpenAIClient, rewriteScript, expandCueCardWithOriginalScript } from '@/app/utils/azure_opai';


export async function PUT(request) {
    const body = await request.json();
    if(!body.data || body.data.previous_scripts===null || body.data.original_script===null || body.data.prompt===null){
        return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const {previous_scripts, original_script, prompt} = body.data;

    try{
        const client = getAzureOpenAIClient();
        const result = await expandCueCardWithOriginalScript(client, previous_scripts, original_script, prompt);
        return NextResponse.json({ message: "Azure OpenAI chat completion completed successfully", data: result }, { status: 200 });


    }catch(error){
        console.error(error);
        return NextResponse.json({ message: "Azure OpenAI chat completion failed", error: error.message }, { status: 500 });
    }
}