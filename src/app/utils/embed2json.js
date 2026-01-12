export const embed2json = (embed_list, chunk_list, position_list, char_start_idx_list = NaN, char_end_idx_list = NaN) => {
    const json_list = embed_list.map((embed, index) => {
        return {
            vector: embed[0],
            sentence: chunk_list[index],
            sentence_idx: position_list[index],
            char_start_idx: char_start_idx_list[index],
            char_end_idx: char_end_idx_list[index],
        }
    })
    return json_list;
}