import { fetchPlaybooks } from "./fetchPlaybooks.js";
import { fetchChallenge } from './fetchChallenges.js';
import { queryCollection } from './queryCollection.js';
import { queryMP } from './queryMP.js';
import munkres from 'munkres-js';
import { EmbedBuilder } from "@discordjs/builders";
import { queryOTM } from "./queryOtm.js";


// Gathers all MP and Collection moments with prices and slots they fit into
const fetchMoments = async (slots, flowAddress, burn = false, sortKey = 'change24') => {
    let mpList = [];
    let ownedObj = {};
    let maxLA = 0;

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
                let playerName = collObj.edges[j].node.edition.play.metadata.playerFullName;
                if (playerName == '') playerName = collObj.edges[j].node.edition.play.metadata.teamName
                let set = collObj.edges[j].node.edition.set.name;
                let series = collObj.edges[j].node.edition.series.name;

                // Get prices
                let params = {
                    playerName: playerName, 
                    series: series,
                    set: set
                };

                let [la, expLoss] = await queryOTM(params, sortKey = sortKey);

                ownedObj[collObj.edges[j].node.id] = {
                    editionFlowID: collObj.edges[j].node.editionFlowID,
                    player: playerName,
                    team: null,       // Popravi null ce je team moment 
                    slots: [i],
                    series: series,
                    set: set,
                    lowAsk: la,
                    expLoss: (burn ? Math.max((la - 1) * 0.95, 0.95) : expLoss)
                }

            }
            // if record already exist, only add slot index
            else {
                ownedObj[collObj.edges[j].node.id].slots.push(i);
            }
        }

        // Get MP moments
        let mpObj = await queryMP(query);
        if (burn) {
            let cheapest = mpObj.edges[0];
            cheapest.expLoss = parseInt(cheapest.node.lowestPrice);
            mpList.push(cheapest);
            maxLA = Math.max(maxLA, parseInt(cheapest.node.lowestPrice) + 1);
        }
        else {
            let cheapest = await findCheapest(mpObj.edges);
            mpList.push(cheapest);
            maxLA = Math.max(maxLA, parseInt(cheapest.lowestPrice) + 1);
        }

    }

    return [mpList, ownedObj, maxLA];
}

// Finds cheapest moment out of a list returned in MP Query
const findCheapest = async (moments, sortKey = 'change24') => {
    let cheapest = { expLoss: null };
    for (let moment of moments) {
        let params = {
            playerName: moment.node.edition.play.metadata.playerFullName,
            series: moment.node.edition.series.name,
            set: moment.node.edition.set.name
        };
        let [_, expLoss] = await queryOTM(params, sortKey = sortKey);
        moment.expLoss = expLoss;
        if (cheapest.expLoss == null || moment.expLoss < cheapest.expLoss) cheapest = moment;
        if (cheapest.expLoss == 0.95) break;
    }
    return cheapest;
}


const prepMarix = (mpList, ownedObj, maxLA) => {
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

// Main function that finds cheapest solution to a challenge
export const solveChallenge = async (pbIndex, chIndex, flowAddress) => {
    const pbObj = await fetchPlaybooks();
    if (pbIndex >= pbObj.length) {
        return new EmbedBuilder().setTitle('Invalid playbook index').setDescription('Use `/playbook` to find index for each playbook');
    }
    else if (chIndex >= pbObj[pbIndex].tasks.length) {
        return new EmbedBuilder().setTitle('Invalid challenge index').setDescription('Use `/progress` or `/playbook` to find index for each challenge in the playbook');
    }
    const refID = pbObj[pbIndex].tasks[chIndex].referenceID
    if (refID == null) {
        return new EmbedBuilder().setTitle('The challenge doesn\'t require you to submit moments.').setDescription('If you believe this to be an error, contact babnik21');
    }
    
    // Get challenge object
    const chObj = await fetchChallenge(refID);

    // Handle issues
    if (chObj.totalCount == 0) {
        return new EmbedBuilder().setTitle('The requirements are yet unknown');
    }
    else if (Date.parse(chObj.edges[0].node.endDate) < Date.now()) {
        return new EmbedBuilder().setTitle('Challenge has already ended');
    }        

    let slots = chObj.edges[0].node.slots;
    // Option 1 - there's only one possible challenge:
    if (slots != null) {
        let embed = new EmbedBuilder()
            .setTitle(`${pbObj[pbIndex].title}: ${chObj.edges[0].node.name}`)
            .setDescription(`Ends <t:${Math.floor(Date.parse(chObj.edges[0].node.endDate)/1000)}:f>`)
            .setColor(0xed2939)
            .setURL(`https://nflallday.com/challenges/${refID}`)
        let count = 0;
        let totalPrice = 0;

        // Get moments available for all slots
        let [mpList, ownedObj, maxLA] = await fetchMoments(slots, flowAddress);

        let matrix = prepMarix(mpList, ownedObj, maxLA);

        let solution = munkres(matrix).slice(0, mpList.length);

        for (let i = 0; i < mpList.length; i ++) {
            // If it's a MP moment
            if (solution[i][1] < mpList.length) {
                embed.addFields({
                    name: `Slot ${i+1}) No moment owned. Cheapest available:`,
                    value: `[${mpList[i].node.edition.play.metadata.playerFullName}] \
                        (https://nflallday.com/listing/moment/${mpList[i].node.edition.flowID}/select), \
                        Price: $${parseInt(mpList[i].node.lowestPrice)}, Expected Loss: $${mpList[i].node.expLoss}`,
                    inline: true
                })
            }
            
            // If it's an owned momend
            else {
                let key = Object.keys(ownedObj)[solution[i][1] - mpList.length];
                embed.addFields({
                    name: `Slot ${i+1}) ${ownedObj[key].player}, ${ownedObj[key].set} set, ${ownedObj[key].series}`,
                    value: `View moment [here](https://nflallday.com/moments/${key})`,
                    inline: true
                })
            }

            count++;
        }

        // Add empty fields for alignment
        if (count > 3) {
            while (count%3 != 0) {
                embed.addFields({ name: '\u200b', value: '\u200b', inline: true})
                count++;
            }
        }

        // Add total price to go
        embed.addFields({
            name: `Total price to go: $${totalPrice}`,
            value: '\u200b'
        })
        
        return [embed]
    }

    // Option 2 - there are child challenges:
    else {
        let prices = [], embeds = [];
        // For each of the available child challenges:
        for (let k = 0; k < chObj.edges[0].node.childChallenges.length; k++) {
            let embed = new EmbedBuilder()
                .setTitle(`${pbObj[pbIndex].title}: ${chObj.edges[0].node.name}`)
                .setDescription(`Ends <t:${Math.floor(Date.parse(chObj.edges[0].node.endDate)/1000)}:f>`)
                .setColor(0xed2939)
                .setURL(`https://nflallday.com/challenges/${refID}`)
            let count = 0;
            let totalPrice = 0;
            let totalExpLoss = 0;
            embed.addFields({ name: `Cheapest option: #${k + 1}`, value: '\u200b' });
            let slots = chObj.edges[0].node.childChallenges[k].slots;

            // Get moments available for all slots
            let [mpList, ownedObj, maxLA] = await fetchMoments(slots, flowAddress);

            let matrix = prepMarix(mpList, ownedObj, maxLA);

            let solution = munkres(matrix).slice(0, mpList.length);

            for (let i = 0; i < mpList.length; i ++) {
                // If it's a MP moment
                if (solution[i][1] < mpList.length) {
                    let price = parseInt(mpList[i].node.lowestPrice);
                    let expLoss = mpList[i].node.expLoss;
                    embed.addFields({
                        name: `Slot ${i+1}) No moment owned. Cheapest available:`,
                        value: `[${mpList[i].node.edition.play.metadata.playerFullName}] \
                            (https://nflallday.com/listing/moment/${mpList[i].node.edition.flowID}/select), \
                            Price: $${price}, Expected Loss: $${expLoss}`,
                        inline: true
                    })

                }
                
                // If it's an owned momend
                else {
                    let key = Object.keys(ownedObj)[solution[i][1] - mpList.length];
                    embed.addFields({
                        name: `Slot ${i+1}) ${ownedObj[key].player}, ${ownedObj[key].set} set, ${ownedObj[key].series}`,
                        value: `View moment [here](https://nflallday.com/moments/${key})`,
                        inline: true
                    })
                }

                count++;
            }

            // Add empty fields for alignment
            if (count > 3) {
                while (count%3 != 0) {
                    embed.addFields({ name: '\u200b', value: '\u200b', inline: true})
                    count++;
                }
            }

            embed.addFields({ name: `Total price to go: $${totalPrice}, Expected Loss: $${totalExpLoss}`, value: '\u200b' });

            embeds.push(embed);
            prices.push(totalExpLoss);
        }
        let totalPrice = Math.min(...prices);
        return [embeds[prices.indexOf(totalPrice)]];
    }
}

