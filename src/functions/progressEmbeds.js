import { fetchPlaybooks } from "./utils/fetchPlaybooks.js";
import { fetchChallenge } from "./utils/fetchChallenges.js";
import { EmbedBuilder } from "@discordjs/builders";
import { queryMP } from "./utils/queryMP.js";
import { queryCollection } from "./utils/queryCollection.js";

// Finds user's progress towards a playbook and assembles an embed
export const progressEmbeds = async (index, flowAddress) => {
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