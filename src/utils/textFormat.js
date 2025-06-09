// sometimes, response from openAI give the citation like this
// I studied at Brawijaya University in Malang【114:0†1739757660686-964389288.txt】
// this function will remove the citation.
export async function removeCitations(text) {

    if (!text) {
        return ""
    }

    return text.replace(/【.*?】|\[.*?\]/g, "").trim() // Removes [1], [2], etc.
}