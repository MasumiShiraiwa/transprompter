import * as Y from 'yjs';


export class YjsInstance {
    constructor() {
        this.Y = Y;
        this.ydoc = new this.Y.Doc();
        this.yScriptArray = this.ydoc.getArray('script');
        this.yGroupArray = this.ydoc.getArray('group');
        this.ySpeakerArray = this.ydoc.getArray('speaker');
        this.yModeMap = this.ydoc.getMap();
        this.localUpdateHandler();
    }

    // 初期化時の同期
    async sync() {
        console.log("sync");
        const res_sync = await fetch('/api/yjs/sync', {
            method: 'GET',
        });
        const data_sync = await res_sync.json();
        const update = data_sync.update;
        const updateArray = update instanceof Object && !Array.isArray(update) ? Object.values(update) : update;
        const updateUint8 = new Uint8Array(updateArray);
        this.Y.applyUpdate(this.ydoc, updateUint8, "remote");
    }

    // ローカル更新時の処理
    async localUpdateHandler() {
        if(!this.ydoc || !this.Y) return;
        this.ydoc.on("update", async (update, origin) => {
            if(origin === "remote") return;
            await fetch('/api/yjs/update', {
                method: 'POST',
                body: JSON.stringify({update: Array.from(update)}),
            });
        });
    }

    // リモートからの更新を受け取る
    async remoteUpdateHandler(remote_update) {
        if(!this.ydoc || !this.Y) return;
        this.Y.applyUpdate(this.ydoc, remote_update, "remote");
    }

    // SET関数

    // スクリプトの更新(Group単位)(lineとは、Group内の配列)
    async updateScript(groupIdx, line) {
        console.assert(Array.isArray(line) && line.length > 0, "line must be a non-empty array");
        this.yScriptArray.delete(groupIdx, 1);
        this.yScriptArray.insert(groupIdx, [line]);
    }

    async insertScript(groupIdx, line) {
        console.assert(Array.isArray(line) && line.length > 0, "line must be a non-empty array");
        this.yScriptArray.insert(groupIdx, [line]);
    }

    async deleteScript(groupIdx) { // Gruop全体の削除
        this.yScriptArray.delete(groupIdx);
    }

    async mergeGroup(leftGroupIdx, rightGroupIdx, line) {
        console.assert(Array.isArray(line) && line.length > 0, "line must be a non-empty array");
        this.yScriptArray.delete(leftGroupIdx, rightGroupIdx - leftGroupIdx + 1);
        this.yScriptArray.insert(leftGroupIdx, [line]);
    }

    async splitGroup(groupIdx) {
        const line = this.yScriptArray.get(groupIdx);
        this.yScriptArray.delete(groupIdx);
        for(let i = 0; i < line.length; i++){
            this.yScriptArray.insert(groupIdx + i, [[line[i]]]);
        }
    }

    // スピーカーの更新
    async updateSpeaker(index, speaker) {
        console.assert(typeof index === 'number', "index must be a number");
        this.ySpeakerArray.delete(index, 1);
        this.ySpeakerArray.insert(index, [speaker]);
    }

    async insertSpeaker(index, speaker) {
        console.assert(typeof index === 'number', "index must be a number");
        this.ySpeakerArray.delete(index, 1);
        this.ySpeakerArray.insert(index, [speaker]);
    }
    async deleteSpeaker(index) {
        this.ySpeakerArray.delete(index);
    }

    // 現在位置を更新する
    async setCurrentPosition(position) {
        this.yModeMap.set('current_position', position);
    }

    // モードを更新する
    async setCueCardMode(mode) {
        console.log("setCueCardMode", mode);
        this.yModeMap.set('cue_card_mode', mode);
    }
    async setPrompterMode(mode) {
        console.log("setPrompterMode", mode);
        this.yModeMap.set('prompter_mode', mode);
    }

    // GET関数
    // スクリプトを取得
    getScript(groupIdx = null) {
        if(groupIdx !== null) return Array.from(this.yScriptArray.get(groupIdx));
        return this.yScriptArray.toArray();
    }
    // スピーカーを取得
    getSpeaker(i = null) {
        if(i !== null) return Array.from(this.ySpeakerArray.get(String(i)));
        return this.ySpeakerArray.toArray(); // Array.from(this.ySpeakerArray.values())は、Array.from(this.ySpeakerArray.toArray())と同じ
    }

    // 現在位置を取得
    getCurrentPosition() {
        return this.yModeMap.get('current_position');
    }

    // モードを取得
    getCueCardMode() {
        return this.yModeMap.get('cue_card_mode');
    }
    getPrompterMode() {
        return this.yModeMap.get('prompter_mode');
    }

    // destroy関数
    async destroy() {
        if(!this.ydoc || !this.Y) return;
        this.ydoc.destroy();
        this.Y = null;
        this.ydoc = null;
        this.yModeMap = null;
    }
}