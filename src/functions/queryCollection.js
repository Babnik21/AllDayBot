import { readFileSync, writeFile } from "fs";


// let testObj = {
//     "after": null,
//     "byBadgeSlugs": [],
//     "byCombinedBadgeSlugs": [],
//     "byFlowIDs": [],
//     "byIDs": [],
//     "byPlayTypes": [],
//     "byPlayerPositions": [],
//     "bySeriesFlowIDs": [],
//     "bySetFlowIDs": [],
//     "bySetIDs": [],
//     "byTeamIDs": [],
//     "byTiers": [
//       "RARE"
//     ],
//     "first": 12,
//     "sortBy": "LISTED_PRICE_ASC_NULLS_LAST"
// }

// Queries moments available on MP based on query parameters passed in.
export const queryCollection = async (queryParams, flowAddress, returnFlowIdList = false) => {
    let tmp;
    let obj;
    queryParams.byOwnerFlowAddresses = [flowAddress];

    // Get filepath
    let filePath = 'src/utils/queryCollectionFull.txt';
    let query = readFileSync(filePath, { encoding: "utf-8" });


    const res = await fetch('https://nflallday.com/consumer/graphql?searchMomentNFTsV2_collection', {
        method: "POST",
        body: JSON.stringify({
            operationName:"searchMomentNFTsV2_collection",
            variables: queryParams,
            query: query
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    tmp = await res.json();

    // Save to file if there's no errors when retrieving data
    if (tmp.hasOwnProperty('errors')) {
        console.log('Error fetching MP Data!')
    }
    else {
        // Save useful information
        obj = tmp.data.searchMomentNFTsV2;
        // writeFile('src/resources/challenge_temp.json', JSON.stringify(obj), (err) => {
        //     if (err) {
        //         console.log(err)
        //     }
        // });
    }

    // If I need list of flow_ids, return that too
    if (returnFlowIdList) {
        let lst = []
        for (let moment of obj.edges) {
            lst.push(moment.node.editionFlowID)
        }
        return [obj, lst]
    }

    return obj;
};

