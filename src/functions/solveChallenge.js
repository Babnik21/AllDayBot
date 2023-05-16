import { fetchPlaybooks } from "./fetchPlaybooks.js";
import { fetchChallenge } from './fetchChallenges.js';
import { queryCollection } from './queryCollection.js';
import { queryMP } from './queryMP.js';
import munkres from 'munkres-js';

// Gathers all MP and Collection moments with prices and slots they fit into
const fetchMoments = async (slots, flowAddress) => {
    let mpList = [];
    let ownedObj = {}
    // for each of the requirements
    for (let i = 0; i < slots.length; i++) {
        let query = slots[i].query;

        //skip freebies
        if (query == null) {
            continue;
        }

        // Get owned moments
        let collObj = await queryCollection(query, flowAddress);
        for (let j = 0; j < collObj.edges.length; j++) {
            // If moment is not eligible for any previous slot, add it
            if (ownedObj[collObj.edges[j].node.id] == undefined) {
                ownedObj[collObj.edges[j].node.id] =  {
                    editionFlowID: collObj.edges[j].node.editionFlowID,
                    player: collObj.edges[j].node.edition.play.metadata.playerFullName,
                    team: null,         // Popravi null ce je team moment 
                    slots: [i],
                    series: collObj.edges[j].node.edition.series.name,
                    set: collObj.edges[j].node.edition.set.name
                }
                if (collObj.edges[j].node.edition.play.metadata.playerFullName == undefined) {
                    console.log(collObj.edges[j].node)
                }
            }
            // if record already exist, only add slot index
            else {
                ownedObj[collObj.edges[j].node.id].slots.push(i);
            }
        }

        // Get MP moments
        let mpObj = await queryMP(query);
        let la = parseInt(mpObj.edges[0].node.lowestPrice);
        mpList.push(la);
    }
    let maxLA = Math.max(mpList) + 1;

    return [mpList, ownedObj, maxLA];
}

const prepMarix = (mpList, ownedObj, maxLA) => {
    let matrix = [];
    if (isNaN(maxLA)) {
        maxLA = 100000;
    }
    
    // Start with MP moments
    for (let i = 0; i < mpList.length; i++) {
        let lst = Array.from({ length: mpList.length }, (_, __) => maxLA);
        lst[i] = mpList[i];
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

// Main function that finds cheapest solution to a challenge
export const solveChallenge = async (pbIndex, chIndex, flowAddress) => {
    const pbObj = await fetchPlaybooks();
    if (pbIndex >= pbObj.length) {
        return 'Invalid playbook index. Use `/playbook` to find index for each playbook';
    }
    else if (chIndex >= pbObj[pbIndex].tasks.length) {
        return 'Invalid challenge index. Use `/progress` or `/playbook` to find index for each challenge in the playbook';
    }
    let str = `    **${pbObj[pbIndex].title}**\n`;
    
    if (pbObj[pbIndex].tasks[chIndex].referenceID == null) {
        return 'The challenge doesn\'t require you to submit moments. If you believe this is an error, contact Babnik';
    }
    
    // Get challenge object
    const chObj = await fetchChallenge(pbObj[pbIndex].tasks[chIndex].referenceID);
    

    // Handle issues
    if (chObj.totalCount == 0) {
        return 'The requirements are yet unknown';
    }
    else if (Date.parse(chObj.edges[0].node.endDate) < Date.now()) {
        return 'Challenge has already ended';
    }

    str += `\n**${chObj.edges[0].node.name}** - Ends <t:${Math.floor(Date.parse(chObj.edges[0].node.endDate)/1000)}:f>`;

    let slots = chObj.edges[0].node.slots;
    // Option 1 - there's only one possible challenge:
    if (slots != null) {
        let totalPrice = 0;

        // Get moments available for all slots
        let [mpList, ownedObj, maxLA] = await fetchMoments(slots, flowAddress);

        let matrix = prepMarix(mpList, ownedObj, maxLA);

        let solution = munkres(matrix).slice(0, mpList.length);

        for (let i = 0; i < mpList.length; i ++) {
            str += `\n  Slot ${i + 1}) `
            // If it's a MP moment
            if (solution[i][1] < mpList.length) {
                str += 'No moment owned. Cheapest available:'
                let mpObj = await queryMP(slots[i].query);
                for (let j = 0; j < Math.min(mpObj.edges.length, 3); j++) {
                    let price = parseInt(mpObj.edges[j].node.lowestPrice)
                    str += `\n    $${price}: <https://nflallday.com/listing/moment/${mpObj.edges[j].node.editionFlowID}>`;
                    if (j == 0) {
                        totalPrice += price;
                    }
                }
            }
            
            // If it's an owned momend
            else {
                let key = Object.keys(ownedObj)[solution[i][1] - mpList.length];
                str += `\n    ${ownedObj[key].player} ${ownedObj[key].set} set, ${ownedObj[key].series}: <https://nflallday.com/moments/${key}>`;
            }
        }
        str += `\n  Total price to go: $${totalPrice}`;
    }

    // Option 2 - there are child challenges:
    else {
        let prices = [], strings = [];
        // For each of the available child challenges:
        for (let k = 0; k < chObj.edges[0].node.childChallenges.length; k++) {
            let totalPrice = 0;
            let tmpStr = `\nCheapest option: #${k + 1}`;
            let slots = chObj.edges[0].node.childChallenges[k].slots;

            // Get moments available for all slots
            let [mpList, ownedObj, maxLA] = await fetchMoments(slots, flowAddress);

            let matrix = prepMarix(mpList, ownedObj, maxLA);

            let solution = munkres(matrix).slice(0, mpList.length);

            for (let i = 0; i < mpList.length; i ++) {
                tmpStr += `\n  Slot ${i + 1}) `
                // If it's a MP moment
                if (solution[i][1] < mpList.length) {
                    tmpStr += 'No moment owned. Cheapest available:'
                    let mpObj = await queryMP(slots[i].query);
                    for (let j = 0; j < Math.min(mpObj.edges.length, 3); j++) {
                        let price = parseInt(mpObj.edges[j].node.lowestPrice)
                        tmpStr += `\n    $${price}: <https://nflallday.com/listing/moment/${mpObj.edges[j].node.editionFlowID}>`;
                        if (j == 0) {
                            totalPrice += price;
                        }
                    }
                }
                
                // If it's an owned momend
                else {
                    let key = Object.keys(ownedObj)[solution[i][1] - mpList.length];
                    tmpStr += `\n    ${ownedObj[key].player} ${ownedObj[key].set} set, ${ownedObj[key].series}: <https://nflallday.com/moments/${key}>`;
                }
            }
            tmpStr += `\n  Total price to go: $${totalPrice}`;

            prices.push(totalPrice);
            strings.push(tmpStr);
        }
        let totalPrice = Math.min(...prices);
        str += strings[prices.indexOf(totalPrice)];
    }

    return str;
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