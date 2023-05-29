import { readFileSync, writeFile } from "fs";
import { fetchChallenge } from "./fetchChallenges.js";
import { queryMP } from "./queryMP.js";
import { queryCollection } from "./queryCollection.js";
import { EmbedBuilder } from "@discordjs/builders";

const discordMsgPlaybooks = async (obj) => {
    let embeds = [
        new EmbedBuilder()
            .setTitle(`NFL All Day Playbooks`)
            .setDescription(`Last updated: <t:${Math.floor(Date.now() / 1000)}:f>`)
            .setColor(0xffffff)
            .setURL('https://nflallday.com/playbooks')
    ];
    
    for (let i = 0; i < obj.length; i++) {
        // Count number of requirements added, to make sure fields are properly aligned
        let count = 0;
        // Skip starter playbook
        if (obj[i].title == 'Starter Playbook') continue;

        let embed = new EmbedBuilder()
            .setTitle(`${i + 1}) ${obj[i].title}`)
            .setDescription(`Ends <t:${Math.floor(Date.parse(obj[i].endAt)/1000)}:f>`)
            .setColor(0xffffff)
            .addFields({ name: 'Playbook Requirements:', value: '\u200b'})
            .setURL(`https://nflallday.com/playbooks/${obj[i].id}`);

        let totalYdsAvailable = 0;

        for (let j = 0; j < obj[i].tasks.length; j++) {
            // Skip if expired
            if (Date.parse(obj[i].tasks[j].validTo) < Date.now()) {continue;};

            if (obj[i].tasks[j].type == 'POINTS') totalYdsAvailable += obj[i].tasks[j].rewardPoints;

            let fieldValue = '\u200b';

            //If it has a different deadline than the playbook itself we want to note that
            if (obj[i].tasks[j].referenceID != null) {
                // Expired and unloaded are causing issues.
                try {
                    let chObj = await fetchChallenge(obj[i].tasks[j].referenceID);
                    if (chObj.edges[0].node.endDate != obj[i].endAt) {
                        if (Date.parse(chObj.edges[0].node.endDate) < Date.now()) {
                            fieldValue = '(Expired)'
                        }
                        else {
                            fieldValue = `Deadline: <t:${Math.floor(Date.parse(chObj.edges[0].node.endDate)/1000)}:f>`;
                        }
                    }
                }
                catch (err) {
                    console.log(err);
                }
            }

            embed.addFields({ 
                name: `${j+1}) ${obj[i].tasks[j].type == 'UPGRADE' ? ':unlock:: ' : ''}${obj[i].tasks[j].title}` 
                    + `${obj[i].tasks[j].type == 'POINTS' ? ' (' + obj[i].tasks[j].rewardPoints + ' YDS)' : ''}`
                    + `${obj[i].tasks[j].category == 'BURN_MOMENT' ? ' :fire:' : ''}`, 
                value: fieldValue,
                inline: true
            })
            count++;

        };

        // Fix alignment and reset count
        if (count > 3) {
            while (count%3 != 0) {
                embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
                count++;
            }
        }
        
        count = 0;


        embed.addFields( {
            name: `Total yards available: ${totalYdsAvailable}`,
            value: '\u200b'
        })

        // Make rewards string
        embed.addFields( {
            name: `Playbook Rewards:`,
            value: '\u200b'
        })
        for (let j = 0; j < obj[i].levels.length; j++) {
            for (let k = 0; k < obj[i].levels[j].rewards.length; k++) {
                // Excluding useless rewards
                if (obj[i].levels[j].rewards[k].title.includes('Banner') || obj[i].levels[j].rewards[k].title.includes('Trophy')) continue;

                let prefix;
                switch (obj[i].levels[j].rewards[k].tier) {
                    case 'PREMIUM':
                        prefix = ':lock: ';
                        break;
                    case 'GRATIS':
                        prefix = ':free: ';
                        break;
                    default:
                        prefix = '';
                        break;
                }

                embed.addFields({
                    name: `${prefix}${obj[i].levels[j].rewards[k].title}`,
                    value: `@${obj[i].levels[j].requiredPoints} YDS`,
                    inline: true
                })
                count++; 
            }
        }

        // Only fix rewards alignment if there's more than 3 rewards displayed
        if (count > 3) {
            while (count%3 != 0) {
                embed.addFields({ name: '\u200b', value: '\u200b', inline: true });
                count++;
            }
        }

        embeds.push(embed)
    }
    if (embeds.length == 0) embeds[0].addFields({ name: 'No playbooks available at this time.', value: '\u200b' })

    return embeds;
    
}

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
        writeFile('src/resources/playbooks.json', JSON.stringify(obj), (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
    return obj;
}

export const discordPlaybookProgress = async (index, flowAddress) => {
    let count = 0
    const pbObj = await fetchPlaybooks();
    if (index >= pbObj.length) {
        return 'Invalid index. Use `/playbook` to find index for each playbook.';
    }

    let embed = new EmbedBuilder()
        .setTitle(`${pbObj[index].title}`)
        .setDescription(`Ends <t:${Math.floor(Date.parse(pbObj[index].endAt)/1000)}:f>`)
        .setColor(0xffffff)
        .setURL(`https://nflallday.com/playbook/${pbObj[index].id}`)

    // Loop for each task in tasks list (playbook)
    for (let i = 0; i < pbObj[index].tasks.length; i++) {
        // we are hoping unlock tasks are always the first ones, otherwise structure is ruined
        if (pbObj[index].tasks[i].referenceID == null) {
            embed.addFields({
                name: `${i+1}) ${pbObj[index].tasks[i].title}`
                    + (pbObj[index].tasks[i].type == 'UPGRADE' ? ' :unlock:' : ''),
                value: pbObj[index].tasks[i].rewardPoints > 0 ? `YDS: ${pbObj[index].tasks[i].rewardPoints}` : '\u200b',
                inline: pbObj[index].tasks[i].type == 'POINTS'
            });
            if (pbObj[index].tasks[i].type == 'POINTS') count++;
            continue;
        }

        // Skipping challenges that don't have requirements yet
        let chObj = await fetchChallenge(pbObj[index].tasks[i].referenceID);
        
        // writeFile(`tmp${i}.json`, JSON.stringify(chObj), (err) => console.log(err));

        if (chObj.totalCount == 0) {
            embed.addFields({ name: `${i+1}) TBD`, value: '\u200b' })
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
                // Skipping those with null query
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
        embed.addFields({
            name: `${i+1}) ${chObj.edges[0].node.name}${priceToGo == 0 ? ' :white_check_mark:' : ''}`,
            value: (priceToGo != 0 ? `Price To Go: $${priceToGo}\n` : '') 
                + (Math.abs(Date.parse(chObj.edges[0].node.endDate) - Date.parse(pbObj[index].endAt))/1000 > 900 
                    ? `Deadline: <t:${Math.floor(Date.parse(chObj.edges[0].node.endDate) / 1000)}:f>\n` : '')
                + (pbObj[index].tasks[i].rewardPoints > 0 ? `YDS: ${pbObj[index].tasks[i].rewardPoints}` : ''),
            inline: true
        });
        count ++;

    }
    
    if (count > 3) {
        while (count%3 != 0) {
            embed.addFields({ name: '\u200b', value: '\u200b', inline: true})
            count++;
        }
    }

    return [embed];
}


// Gets playbook JSON from AD Graphql and makes discord msg for each one.
export const playbooks = async () => {
    let pbObj = await fetchPlaybooks();
    let embeds = await discordMsgPlaybooks(pbObj);
    return embeds;
}

//console.log(await fetchPlaybooks('Short'));

//fetchPlaybooks('Full')