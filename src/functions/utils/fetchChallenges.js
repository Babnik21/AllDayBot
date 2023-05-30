import { readFileSync, writeFile } from "fs";

// Fetches challenge json from provided ID
export const fetchChallenge = async (challengeId, detail = 'short') => {
    let tmp;
    let obj;

    // Get filepath
    let filePath = 'src/utils/queryFetchChallenge'
    switch (detail) {
        case 'full':
            filePath += 'Full.txt';
            break;
        case 'short':
            filePath += 'Short.txt';
            break;
        default:
            filePath += 'Full.txt';
    }
    let query = readFileSync(filePath, { encoding: "utf-8" });


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
        console.log('Error fetching Challenge!')
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

//fetchChallenge("e8329087-e88c-4fa8-bb5e-927bbda5613b")

