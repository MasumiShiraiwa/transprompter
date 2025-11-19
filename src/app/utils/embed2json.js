export const embed2json = (embed_list, script) => {
    const json_list = embed_list.map((embed, index) => {
        return {
            vector: embed[0],
            sentence: script[index],
            position: index,
        }
    })
    return json_list;
}