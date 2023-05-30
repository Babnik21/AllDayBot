import { fetchPlaybooks } from './utils/fetchPlaybooks.js';
import { fetchChallenge } from './utils/fetchChallenges.js';
import munkres from 'munkres-js';
import { EmbedBuilder } from "@discordjs/builders";
import { prepPriceMarix } from "./utils/prepPriceMatrix.js"
import { findChangeInterval } from "./utils/findChangeInterval.js";
import { fetchEligibleMoments } from './utils/fetchEligibleMoments.js';

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
        if (pbObj[pbIndex].tasks[chIndex].type == 'UPGRADE') {
            return new EmbedBuilder
                .setTitle(`Can't be bothered to solve this dumbass task. Just burn ${pbObj[pbIndex].tasks[chIndex].validations.moments[0].quantity} ${pbObj[pbIndex].tasks[chIndex].validations.moments[0].tier.toLowerCase()} moment(s)`)
                .setDescription('Just use cheapest on market or in your collection');
        }
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

    // Determine sortkey for expected loss based on time period since challenge start
    let sortKey = findChangeInterval(chObj.edges[0].node.startDate);

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
        let burn = chObj.edges[0].node.name.toLowerCase().includes('burn');

        // Get moments available for all slots
        let [mpList, ownedObj, maxLA] = await fetchEligibleMoments(slots, flowAddress, burn = burn, sortKey = sortKey);

        let matrix = prepPriceMarix(mpList, ownedObj, maxLA);

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
            let burn = chObj.edges[0].node.childChallenges[k].name.toLowerCase().includes('burn');


            embed.addFields({ name: `Cheapest option: #${k + 1}`, value: '\u200b' });
            let slots = chObj.edges[0].node.childChallenges[k].slots;

            // Get moments available for all slots
            let [mpList, ownedObj, maxLA] = await fetchEligibleMoments(slots, flowAddress, burn = burn, sortKey = sortKey);

            let matrix = prepPriceMarix(mpList, ownedObj, maxLA);

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

