import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false; // ローカルモデルを使用しない
env.allowRemoteModels = true; // リモートモデルを許可


// Transformers.js で モデルを一度だけロードして使い回すためのシングルトンクラス
class PipelineSingleton{
    static task = "feature-extraction"; // タスクの種類
    static model = "Xenova/multilingual-e5-small"; // モデルの名前
    static instance = null; // インスタンスを保持

    static async getInstance(progress_callback){
        if(this.instance === null){
            console.log("モデルをロードします", new Date().toISOString());
            this.instance = await pipeline(this.task, this.model, {progress_callback, dtype: "fp32"});
            console.log("モデルをロードしました", new Date().toISOString(), this.instance);
        }else{
            console.log("モデルはすでにロードされています");
        }
        return this.instance;
    }
}


// メインスレッドのworker.postMessage(...)からのメッセージを受け取る
// selfは、Workerオブジェクト
self.addEventListener("message", async (event) => {
    const text_list = event.data.text_list;
    let embed_list = [];

    try{
        // モデルのインスタンスを取得
        let instance = await PipelineSingleton.getInstance(x => {
            // console.log("progress_callback", x);
            self.postMessage(x); // メインスレッドに結果を返す
        });


        for (const text of text_list){
            const res = await instance(text, { pooling: "mean", normalize: true }); // resはTensorオブジェクトのため、通常の配列に変換する

            // Tensorオブジェクトを通常の配列に変換
            let resArray;
            try {
                if (res.tolist) {
                    resArray = res.tolist();
                } else if (res.data) {
                    resArray = Array.from(res.data);
                } else if (res.array) {
                    resArray = res.array();
                } else {
                    // フォールバック: 直接配列として扱う
                    resArray = Array.from(res);
                }
            } catch (conversionError) {
                console.error("Tensor変換エラー:", conversionError);
                // 最終フォールバック
                resArray = res.toString();
            }
            embed_list.push(resArray);
        }
        console.log("embed_list", embed_list);

        self.postMessage({
            status: "success",
            data: embed_list,
        });

    }catch(error){
        console.error("errorが発生しました", error);
        self.postMessage({
            status: "error",
            error: error.message,
        });
    }
});