import mcGuessServerCommunication from "./serverCommunication";


export async function itemNameMatch(i1: string, i2: string) : Promise<boolean> {
    // Remove "_from_" suffix and everything after it
    function removeSuffix(s: string) {
        const fromIndex = s.indexOf("_from_");
        if (fromIndex !== -1) {
            s = s.substring(0, fromIndex);
        }

        const fromIndex2 = s.indexOf("dye_");
        if (fromIndex2 !== -1) {
            s = s.substring(4);
        }

        return s;
    }

    // Check if the two items belong to one category

    if (removeSuffix(i1) === removeSuffix(i2)) {
        return true;
    }

    let mcsc = new mcGuessServerCommunication();

    const c1 = await mcsc.getItemCategory(i1);
    const c2 = await mcsc.getItemCategory(i2);

    if (c1 !== null && c2 !== null && c1 === c2) {
        return true;
    }

    if (c1 === i2 || c2 === i1) {
        return true;
    }

    return false;
}