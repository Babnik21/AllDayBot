import { readFileSync, writeFile } from "fs";

// Fetches playbook info from 'GetActiveRewardPasses', saves to ./src/resources/playbooks.json
export const fetchPlaybooks = async () => {
    let tmp;
    let obj;

    // Get filepath
    let filePath = 'src/utils/queryGetActiveRewardPassesShort.txt'

    let query = readFileSync(filePath, { encoding: 'utf-8' });

    const res = await fetch('https://nflallday.com/consumer/graphql?GetActiveRewardPasses', {
        method: "POST",
        body: JSON.stringify({
            operationName:"GetActiveRewardPasses",
            variables: {},
            query: query
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    tmp = await res.json();

    // Save to file if there's no errors when retrieving data
    if (tmp.hasOwnProperty('errors')) {
        console.log('Error fetching Playbooks!')
    }
    else {
        // Save useful information
        obj = tmp.data.getActiveRewardPasses;
        // writeFile('src/resources/playbooks.json', JSON.stringify(obj), (err) => {
        //     if (err) {
        //         console.log(err)
        //     }
        // });
    }
    return obj;
}