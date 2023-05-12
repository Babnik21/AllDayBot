import { readFileSync, writeFile } from "fs";


// ID = od zgori referenceID
// Ta ima not challenge instructions in eligible moments query, enddate
export const fetchChallenge = async (challengeId) => {
    let tmp;
    let obj;
    let query = readFileSync("src/utils/queryFetchChallengeFull.txt", { encoding: "utf-8" });


    const res = await fetch('https://nflallday.com/consumer/graphql?searchChallenges_challenge', {
        method: "POST",
        body: JSON.stringify({
            operationName:"searchChallenges_challenge",
            variables:{
                byIDs:[challengeId]
            },
            query: query
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    tmp = await res.json();

    // Save to file if there's no errors when retrieving data
    if (tmp.hasOwnProperty('errors')) {
        console.log('Error fetching Playbooks!')
    }
    else {
        // Save useful information
        obj = tmp.data.searchChallenges;
        writeFile('src/resources/challenge_temp.json', JSON.stringify(obj), (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
    return obj;
};

let chId = "e61ecfca-029e-406d-a38c-9047ec34f8ee";

export const fetchEligibleMoments = async (ownerFlowAddress) => {
    let tmp;
    let obj;
    let query = readFileSync("src/utils/queryEligibleMomentsFull.txt", { encoding: "utf-8" });

    const res = await fetch('https://nflallday.com/consumer/graphql?searchMomentNFTsV2_challengesMoment', {
        method: "POST",
        body: JSON.stringify({
            operationName:"searchMomentNFTsV2_challengesMoment",
            variables: {"after":null,"byBadgeSlugs":[],"byCombinedBadgeSlugs":[],"byEditionFlowIDs":[],"byFlowIDs":[],"byIDs":[],"byOwnerFlowAddresses":[ownerFlowAddress],"byPlayTypes":[],"byPlayerIDs":[],"byPlayerPositions":["QB"],"bySeriesFlowIDs":[],"bySetIDs":[],"byTeamIDs":[],"byTiers":["RARE","LEGENDARY","ULTIMATE"],"first":null,"sortBy":"ACQUIRED_AT_DESC"},
            query: query
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    tmp = await res.json();

    // Save to file if there's no errors when retrieving data
    if (tmp.hasOwnProperty('errors')) {
        console.log('Error fetching Playbooks!');
        console.log(tmp)
    }
    else {
        // Save useful information
        obj = tmp.data.searchMomentNFTsV2;
        writeFile('src/resources/moments_temp2.json', JSON.stringify(obj), (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
    return obj;
}


let myFlow = "c1a251abdc74a103";

fetchPlaybooks();
