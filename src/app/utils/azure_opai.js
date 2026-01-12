// サーバ側で利用する

import { AzureOpenAI } from "openai";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const api_version = process.env.AZURE_OPENAI_API_VERSION;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const model = process.env.AZURE_OPENAI_MODEL;


export const getAzureOpenAIClient = () => {
    try {
        const client = new AzureOpenAI ({
            apiVersion: api_version,
            endpoint: endpoint,
            apiKey: apiKey,
        });
        return client;
    } catch (error) {
        console.error("Azure OpenAI client creation failed", error);
        throw error;
    }
}

export const getChatCompletion = async (client, messages) => {
    try {
        const response  = await client.chat.completions.create({
            messages: messages,
            max_completion_tokens:1024, // 最大トークン数(生成する最大トークン数)
            temperature:1.0, // 温度(出力のランダム性)
            top_p:1.0, // トップP(出力のランダム性)
            model:deployment // モデル(デプロイメント)
            // stream=True, // 出力のストリーミングを有効にする。
        });

        // for (const choice of response.choices) {
        //   console.log(choice.message.content);
        // }
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Azure OpenAI chat completion failed", error);
        throw error;
    }
}

export const estimatePosition = async (client, new_speech, speech_history, previous_position, scripts) => {
    console.log(typeof scripts);
    try{
        const system_message = `
        You are assistant for teleprompter application.
        Your task is to determine current "position" (sentence index) of "new_speech" within provided "script".

        Input Data:
        - script: JSON object { sentence_idx: "sentence text" }.
        - speech_history: The cumulative history of sentences spoken by user so far.
        - previous_position: The index of the last identified speech.
        - new_speech: The current text spoken by user.

        Logic & Rules:
        1. Context Analysis: Consider that "new_speech" follows the context of "speech_history" (typically index > previous_position).
        2. Matching: Find the sentence in "script" that semantically matches "new_speech". Allow for paraphrasing or minor wording differences.
        3. Ad-lib / Noise Handling:
        - If "new_speech" is an ad-lib, private conversation, off-topic, or cannot be found in the script with confidence:
        - You MUST return the value of "previous_position" as a "position" and "new_speech" as empty "".
        4. If "new_speech" is found in the script or has strong relevance with the script, you MUST modify "new_speech" as natural expression to add to the speech history for the next prediction.
        
        Output Format:
        - Return strictly a JSON object: {"position": "index of new speech in the script", "new_speech": "modified new speech text as natural expression"}
        - new_speech is the text of the modified new speech as natural expression.
        `
        const messages = [{"role": "system", "content": system_message}, 
            {"role": "user", "content": 
                `
                Script Data: ${JSON.stringify(Object.values(scripts).map(script => script.replace(/\|/g, "")))}
                
                Current Context:
                - Previous Position: ${previous_position}
                - Speech History: ${speech_history}
                
                Target to Find:
                - New Speech: ${new_speech}

                Task: Return JSON {"position": "...", "new_speech": "..."}
                `
            }]
        const result = await getChatCompletion(client, messages);

        console.log("result", result, "new_speech", new_speech);
        return result; // response.choices[0].message.content
    }catch(error){
        console.error("Azure OpenAI chat completion failed", error);
        throw error;
    }
}