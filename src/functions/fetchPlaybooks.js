import { readFileSync, writeFile } from "fs";
import { fetchChallenge } from "./fetchChallenges.js";
import { queryMP } from "./queryMP.js";
import { queryCollection } from "./queryCollection.js";

const discordMsgPlaybooks = (obj) => {
    let lst = [];
    let totalYdsAvailable = 0;
    for (let i = 0; i < obj.length; i++) {
        // Skip starter playbook
        if (obj[i].title == 'Starter Playbook') {continue;}
        
        // Make a requirements string
        let str = `**${i + 1}) ${obj[i].title}** - Ends <t:${Math.floor(Date.parse(obj[i].endAt)/1000)}:f>`
        for (let j = 0; j < obj[i].tasks.length; j++) {
            // Skip if expired
            if (Date.parse(obj[i].tasks[j].validTo) < Date.now()) {continue;};

            // Add text
            if (obj[i].tasks[j].type == 'UPGRADE') {
                str += `\n    :unlock:: ${obj[i].tasks[j].title}`;
                if (obj[i].tasks[j].category == 'BURN_MOMENT') {str += ' :fire:'}
                str += '\n'
            }
            else  if (obj[i].tasks[j].type == 'POINTS') {
                str += `\n    ${obj[i].tasks[j].title} (${obj[i].tasks[j].rewardPoints} YDS)`;
                totalYdsAvailable += obj[i].tasks[j].rewardPoints;
                if (obj[i].tasks[j].category == 'BURN_MOMENT') {str += ' :fire:'}
            }

            // If it has a different deadline than the playbook itself we want to note that
            if (obj[i].tasks[j].validTo != obj[i].endAt) {
                str += `\n      Deadline: <t:${Math.floor(Date.parse(obj[i].tasks[j].validTo)/1000)}:f>`;
            }
        };
        str += `\n  Total yards available: ${totalYdsAvailable}`

        // Make rewards string
        str += `\n  **Playbook rewards:**`
        for (let j = 0; j < obj[i].levels.length; j++) {
            for (let k = 0; k < obj[i].levels[j].rewards.length; k++) {
                // Excluding useless rewards
                if (!obj[i].levels[j].rewards[k].title.includes('Banner') && !obj[i].levels[j].rewards[k].title.includes('Trophy')) {
                    if (obj[i].levels[j].rewards[k].tier == 'PREMIUM') {
                        str += '\n    :lock:'
                    }
                    else if (obj[i].levels[j].rewards[k].tier == 'GRATIS') {
                        str += '\n    :free:' 
                    }
                    str += ` @${obj[i].levels[j].requiredPoints} YDS, ${obj[i].levels[j].rewards[k].title}`        
                }
            }
        }

        lst.push(str);
    }

    return lst;
    
}

// Fetches playbook info from 'GetActiveRewardPasses', saves to ./src/resources/playbooks.json
export const fetchPlaybooks = async (detail = 'short') => {
    let tmp;
    let obj;

    // Get filepath
    let filePath = 'src/utils/queryGetActiveRewardPasses'
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
        writeFile('src/resources/playbooks.json', JSON.stringify(obj), (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
    return obj;
}

export const discordPlaybookProgress = async (index, flowAddress) => {
    const pbObj = await fetchPlaybooks('short');
    if (index >= pbObj.length) {
        return 'Invalid index. Use `/playbook` to find index for each playbook.';
    }
    let str = `**${pbObj[index].title}** - Ends <t:${Math.floor(Date.parse(pbObj[index].endAt)/1000)}:f>`;
    // Loop for each task in tasks list (playbook)
    for (let i = 0; i < pbObj[index].tasks.length; i++) {
        // Recognising unlock type task and treating it seperately
        if (pbObj[index].tasks[i].referenceID == null) {
            str += `\n  ${i+1}) ${pbObj[index].tasks[i].title} :unlock:`;
            continue;
        }

        // Skipping challenges that don't have requirements yet
        let chObj = await fetchChallenge(pbObj[index].tasks[i].referenceID);
        if (chObj.totalCount == 0) {
            str += `\n  ${i+1}) TBD`;
            continue;
        }
        // Skipping if expired
        else if (Date.parse(chObj.edges[0].node.endDate) < Date.now()) {
            continue;
        }
        
        // If there's a single challenge for this slot
        let priceToGo = 0;
        if (chObj.edges[0].node.slots != null) {
            // For each of the requirements
            for (let j = 0; j < chObj.edges[0].node.slots.length; j++) {
                let query = chObj.edges[0].node.slots[j].query;
                
                // Query is null for freebies usually
                // Skipping those with null query and expired ones
                if (query == null) {
                    continue;
                }

                // If no required moment is owned, find cheapest on market and extract price
                let collObj = await queryCollection(query, flowAddress);
                if (collObj.edges.length == 0) {
                    let mpObj = await queryMP(query);
                    let price = parseInt(mpObj.edges[0].node.lowestPrice)
                    priceToGo += price;
                }
            }
        }
        // If there are multiple challenge choices for a single task slot
        else {
            let tmpPriceToGo = 0;
            let minPrice = null;
            // For each of the child challenges available
            for (let k = 0; k < chObj.edges[0].node.childChallenges.length; k++) {
                let subChObj = chObj.edges[0].node.childChallenges[k];
                // For each of the requirements
                for (let j = 0; j < subChObj.slots.length; j++) {
                    let query = subChObj.slots[j].query;

                    // Query is null for freebies usually
                    if (query == null) {
                        continue;
                    }

                    // If no required moment is owned, find cheapest on market and extract price
                    let collObj = await queryCollection(query, flowAddress);
                    if (collObj.edges.length == 0) {
                        let mpObj = await queryMP(query);
                        let price = parseInt(mpObj.edges[0].node.lowestPrice);
                        priceToGo += price;
                    }
                }
                if (minPrice == null || tmpPriceToGo < minPrice) {
                    minPrice = tmpPriceToGo;
                }
                tmpPriceToGo = 0;
            }
            priceToGo += minPrice;
        }

        // Assemble task string
        str += `\n  ${i+1}) ${chObj.edges[0].node.name}`
        if (priceToGo == 0) {
            str += ` :white_check_mark:`
        }
        else {
            str += ` - Price To Go: $${priceToGo}`
        }
        if (Date.parse(chObj.edges[0].node.endDate) < Date.parse(pbObj[index].endAt)) {
            str += `\n    Deadline: <t:${Math.floor(Date.parse(chObj.edges[0].node.endDate) / 1000)}:f>`
        }
    }
    return str;
}


//console.log(await discordPlaybookProgress(0, "c1a251abdc74a103"));



// Gets playbook JSON from AD Graphql and makes discord msg for each one.
// Only "short" detail for now
export const playbooks = async (detail) => {
    let pbObj = await fetchPlaybooks('Short');
    let msgLst = discordMsgPlaybooks(pbObj);
    return msgLst;
}

//console.log(await fetchPlaybooks('Short'));

//fetchPlaybooks('Full')