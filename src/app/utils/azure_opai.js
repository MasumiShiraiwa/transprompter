// サーバ側で利用する

import { AzureOpenAI } from "openai";
import path from 'path';
import fs from 'fs';

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

export const getChatCompletion_estimation = async (client, messages) => {
    try {
        const response  = await client.chat.completions.create({
            messages: messages,
            max_completion_tokens:1024, // 最大トークン数(生成する最大トークン数)
            temperature:0.3, // 温度(出力のランダム性)
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

export const getChatCompletion_rewriting = async (client, messages) => {
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

export const estimatePosition = async (client, target_speech, speech_history, previous_position, scripts) => {
    try{
        const system_message = `
        Your task is to identify the position(0-based index) of the "target_speech" in the "script".

        Input:
        - script: JSON object { sentence_idx: "sentence text" }.
        - target_speech: The current sentence spoken by user.

        Logic:
        Compare the "target_speech" with the "script" sentences by sentence.
        If the "target_speech" is similar to the "script" sentence, get the index of the "script" sentence as the candidates.
        - Even if the phrasing differs, include it as a candidate if the meaning is the same.
        - If there is a possibility that the "target_speech" is Ad-lib, non-relevant conversation, off-topic, or other content that is not in "script", ignore the candidates.
        If the candidates for the "position" are more than one, use "speech_history" to determine the most likely position.
        - "speech_history" is the cumulative history of sentences spoken by user so far.
        - "speech_history" is used to eliminate a sentence candidate that is in a leap from the previous position.
        - However, There is a little possibility that the last sentence of the "speech_history" is the same as the "target_speech" because of the delay of the speech recognition.
        Identify the most likely position from the candidates.
        - Set "found_speech" = the identified content of the "script" sentence.
        - If the "target_speech" is not similar to the "script" sentence, set "found_speech" = "".
        If the "found_speech" is not empty, set "position" = the index of the "script" sentence.
        - If the "found_speech" is empty, set "position" = "".

        Output:
        - Return strictly a JSON object: {"position": "", "found_speech": ""}
        `

        const messages = [{"role": "system", "content": system_message}, 
            {"role": "user", "content": 
                `
                script: ${JSON.stringify(Object.fromEntries(Object.entries(scripts).map(([index, v]) => [index, v.text.replace(/\|/g, "")])))}

                Current Context:
                - speech_history: ${speech_history}

                Target to Find:
                - target_speech: ${target_speech}

                Task: Return JSON {"position": "...", "found_speech": "..."}
                `
            }]



        // const messages = [{"role": "system", "content": system_message}, 
        //     {"role": "user", "content": 
        //         `
        //         script: ${JSON.stringify(Object.fromEntries(Object.entries(scripts).map(([index, v]) => [index, v.text.replace(/\|/g, "")])))}
                
        //         Current Context:
        //         - previous_position: ${previous_position}
        //         - speech_history: ${speech_history}
                
        //         Target to Find:
        //         - target_speech: ${target_speech}

        //         Task: Return JSON {"position": "...", "new_speech": "..."}
        //         `
        //     }]
        const result = await getChatCompletion_estimation(client, messages);

        console.log("previous_position", previous_position);
        console.log("speech_history", speech_history);
        console.log("result", result, "target_speech", target_speech);
        return result; // response.choices[0].message.content
    }catch(error){
        console.error("Azure OpenAI chat completion failed", error);
        throw error;
    }
}

export const rewriteScript = async (client, previous_scripts, start_position, remain_time) => {
    console.log("previous_scripts: ", previous_scripts, "start_position: ", start_position);
    try{
        let system_message = `
        You are assistant for auto rewriting or summarizing script application.
        Your task is to rewrite or summarize the script based on previous script and the start position and the remain time[s].

        Input Data:
        - Previous Script: JSON object { sentence_idx(0-start index): "sentence text" }.
        - Start Position: The index of the start position to rewrite.
        - Remain Time: The remain time[s].

        Logic & Rules:
        1. Understand contents of the sentences before the start position in the previous_script(not including the start position).
        2. Estimate the number of sentences that can be rewritten in the remain time[s].
        3. Specify the language of the previous_script and set the output language to the same language.
        4. Modify the sentences from the start position (not including the before start position) in the previous_script to fit the remain time[s] and the original contents.
            - In Japanese and English, 300 characters and 120 words per sentence is recommended, respectively.
            - CRITICAL - Output language MUST match the input "previous_script" language.
            - Keep the original contents as much as possible.
        5. Return the rewritten or summarized script from the start position sentence (previous_script[start_position]).
            - Keep the same format as the input.
            
        Output Format:
        - Return strictly a JSON object: {"rewritten_script": Object}
            - rewritten_script is a JSON object { sentence_idx: "rewritten script text" }.
            - the first sentence_idx is the start position - 1.
            - Separate the rewritten script by period.
        `

        const messages = [{"role": "system", "content": system_message}, 
            {"role": "user", "content": 
                

                `Previous Script: ${JSON.stringify(Object.fromEntries(Object.entries(previous_scripts).map(([index, v]) => [index, v.text.replace(/\|/g, "")])))}
                Start Position: ${start_position + 1}
                Remain Time: ${remain_time} [s]`}
        ]
        const result = await getChatCompletion_rewriting(client, messages);
        return result; // response.choices[0].message.content
    }catch(error){
        console.error("Azure OpenAI chat completion failed", error);
        throw error;
    }
}


export const expandCueCardWithOriginalScript = async (client, previous_cue_card, original_script, prompt) => {
    console.log("previous_cue_card: ", previous_cue_card);
    console.log("original_script: ", original_script);
    console.log("prompt: ", prompt);
    try{
        let selection_rule = fs.readFileSync(path.join(process.cwd(), 'src', 'scripts', 'selection_rule.md'), 'utf8');

        // タスクを取捨選択として考える。
        let system_message = `
        You are assistant for converting the original script into the cue card following some patterns and rules.
        Your task is to resume converting the script that has been partially converted into the cue card based on the rules.
        
        Input Data:
        1. Original Script: JSON object [{original_sentence_idx: "sentence idx", text: "sentence text", speaker: "speaker name" }, ...], which is containing the script content and dialogue.
        2. Previous Cue Card: JSON object {key=cue_card_sentence_idx: value="sentence text"}, which contains the cue card content and dialogue. 
        - Cue card was converted by the user from earlier part of the original script, following the format conversion rules.
        - Here, original_sentence_idx does not necessarily correspond to the cue_card_sentence_idx.
        3. Selection Rules: The rules you have to follow for selecting the script from the original script.

        Output Format:
        - Return strictly a JSON object: {"expanded_cue_card": JSON object}
            - expanded_cue_card is a JSON object {key=cue_card_sentence_idx: value="expanded sentence text"}.
            - the first cue_card_sentence_idx is the position of the first sentence in the expanded cue card.
            - "cue_card_sentence_idx" is 0-based index.

        Logic & Rules:
        Step 1. Understand the selection rules from "Selection Rules".
        1. Read the "Selection Rules" carefully and understand the rules to apply later.

        Step 2. Alignment (Preparatory process)
        Purpose: Build the correspondence between Original Script and Previous Cue Card. This prepares for (a) analyzing the user's transformation patterns in Step 3, and (b) finding where to resume conversion.
        1. For each entry in "Previous Cue Card", identify which sentence(s) in "Original Script" it was derived from (original_sentence_idx → cue_card_sentence_idx mapping).
        2. Conversely, for each sentence in "Original Script" that appears in "Previous Cue Card", identify which cue card entry it corresponds to.
        3. Based on this correspondence, find the first sentence in "Original Script" that has not yet been converted into "Previous Cue Card". This is the resume point.

        Step 3. Analysing the user pattern
        Previous cue card reflects the user's conversion intent and conversion patterns as well as the conversion rules.
        1. Compare the "Original Script" and "Previous Cue Card" to identify the user's conversion patterns.
        2. Analyze the patterns of the transformation from the "original script" into the "cue card".
        - For example, these patterns may include "Selecting Appropriate Dialogue and Instructions", "Modifying Dialogue Expression", "Skipping Unnecessary Dialogue" etc.
        
        Step 4. Resume Selection with the pattern
        1. Apply the selection rules strictly to the remaining "Original Script".
        -  Retrieve a sentence from remaining "original script" in order.
        -  Then, apply the rules to the sentence and select only the sentence that matches conversion rules. If the sentence does NOT match the rules, skip it.
        -  Don't invent new other rules.
        2. Apply the inferred user's transformation patterns to the selected sentence.
        3. If consistency between the result and the patterns or rules is not guaranteed, apply the pattern and rules again.
        4. Repeat step 4 until all the sentences in the "Original Script" are processed.

        Step 5. Verify the result
        1. Verify the sentences of the result are not included in the "Previous Cue Card".
        2. Check if the result complies with the conversion rules.
        3. Ensure that the selection is complete all the way to the last line.
        4. Return the selected script, excluding the already converted part(input cue card data).
        `


        const messages = [{"role": "system", "content": system_message}, 
            {"role": "user", "content": `
                Original Script: ${JSON.stringify(Object.entries(original_script).map(([index, v]) => [{original_sentence_idx: v.index, text: v.text, speaker: v.speaker}]))}
                Previous Cue Card: ${JSON.stringify(Object.fromEntries(Object.entries(previous_cue_card).map(([index, v]) => [index, v.text.replace(/\|/g, "")])))}
                Selection Rules: ${selection_rule}
                `}
                // Prompt: ${prompt}`}
        ]

        const result = await getChatCompletion_rewriting(client, messages);
        console.log("result: ", result);
        return result; // response.choices[0].message.content
    }catch(error){
        console.error("Azure OpenAI chat completion failed", error);
        throw error;
    }
}