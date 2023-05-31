import { logger } from "../../logger.js";

export const queryOTM = async (params, sortKey = 'change24') => {
    params.sortby = sortKey;
    let url = `https://www.otmnft.com/api/nflallday/market/moments?limit=2&page=1`
    url += `&playerName=${params.playerName}&series=${params.series}&set=${params.set}&sortby=-${sortKey}`
    url = url.replace(/ /g, '%20');
    const res = await fetch(url, {
        method: "GET"
    })
    let tmp = await res.json();

    if (tmp.hasOwnProperty('detail')) {
        logger.info('Error fetching MP Data!');
        return;
    }
    if (tmp.data.length == 0) {
        logger.info(`Moment not found. Name: ${params.playerName}, Series: ${params.series}, Set: ${params.set} `);
        logger.info('Response: ' + JSON.stringify(tmp));
        return [
            100000,
            100000
        ];
    }
    let lst = [
        tmp.data[0].price,
        Math.max((tmp.data[0].price - 1) * 0.95 - (tmp.data[0].price * 100 / (100 + tmp.data[0][sortKey])) * 0.9 * 0.95, 0.95)
        // Undercut by 1 * (1 - MP fee) - (Expected post-challenge price (=prechallenge price) * lowball * (1 - MP fee))
    ]
    return lst;

}

