// Prepares a cost matrix for hungarian algoithm
export const prepPriceMarix = (mpList, ownedObj, maxLA) => {
    let matrix = [];
    if (isNaN(maxLA)) {
        maxLA = 100000;
    }
    
    // Start with MP moments
    for (let i = 0; i < mpList.length; i++) {
        let lst = Array.from({ length: mpList.length }, (_, __) => maxLA);
        lst[i] = mpList[i].expLoss;
        lst = lst.concat(Array.from({ length: Object.keys(ownedObj).length}, (_, __) => 0));
        matrix.push(lst);
    }
    
    // Add Owned moments
    for (let i = 0; i < Object.keys(ownedObj).length; i++) {
        let lst = Array.from({ length: mpList.length }, (_, __) => maxLA);
        let key = Object.keys(ownedObj)[i];
        // Set zeroes for slots moment fits into
        for (let j = 0; j < ownedObj[key].slots.length; j++) {
            lst[ownedObj[key].slots[j]] = 0;
        }
        lst = lst.concat(Array.from({ length: Object.keys(ownedObj).length}, (_, __) => 0));
        matrix.push(lst);
    }

    return matrix;
}