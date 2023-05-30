import { readFileSync, writeFile } from "fs";

// Queries moments available on MP based on query parameters passed in.
export const queryMP = async (queryParams) => {
    let tmp;
    let obj;
    queryParams.sortBy = 'PRICE_ASC';

    // Get filepath
    let filePath = 'src/utils/queryMPFull.txt';
    let query = readFileSync(filePath, { encoding: "utf-8" });


    const res = await fetch('https://nflallday.com/consumer/graphql?searchMarketplaceEditions', {
        method: "POST",
        body: JSON.stringify({
            operationName:"searchMarketplaceEditions",
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
        obj = tmp.data.searchMarketplaceEditions;
        // writeFile('src/resources/challenge_temp.json', JSON.stringify(obj), (err) => {
        //     if (err) {
        //         console.log(err)
        //     }
        // });
    }
    return obj;
};

