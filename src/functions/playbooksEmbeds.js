import { readFileSync, writeFile } from "fs";
import { fetchChallenge } from "./utils/fetchChallenges.js";
import { EmbedBuilder } from "@discordjs/builders";

export const playbooksEmbeds = async (pbObj) => {
    let embeds = [
        new EmbedBuilder()
            .setTitle(`NFL All Day Playbooks`)
            .setDescription(`Last updated: <t:${Math.floor(Date.now() / 1000)}:f>`)
            .setColor(0xffffff)
            .setURL('https://nflallday.com/playbooks')
    ];
    
    for (let i = 0; i < pbObj.length; i++) {
        // Count number of requirements added, to make sure fields are properly aligned
        let count = 0;
        // Skip starter playbook
        if (pbObj[i].title == 'Starter Playbook') continue;

        let embed = new EmbedBuilder()
            .setTitle(`${i + 1}) ${pbObj[i].title}`)
            .setDescription(`Ends <t:${Math.floor(Date.parse(pbObj[i].endAt)/1000)}:f>`)
            .setColor(0xffffff)
            .addFields({ name: 'Playbook Requirements:', value: '\u200b'})
            .setURL(`https://nflallday.com/playbooks/${pbObj[i].id}`);

        let totalYdsAvailable = 0;

        for (let j = 0; j < pbObj[i].tasks.length; j++) {
            // Skip if expired
            if (Date.parse(pbObj[i].tasks[j].validTo) < Date.now()) {continue;};

            if (pbObj[i].tasks[j].type == 'POINTS') totalYdsAvailable += pbObj[i].tasks[j].rewardPoints;

            let fieldValue = '\u200b';

            //If it has a different deadline than the playbook itself we want to note that
            if (pbObj[i].tasks[j].referenceID != null) {
                // Expired and unloaded are causing issues.
                try {
                    let chObj = await fetchChallenge(pbObj[i].tasks[j].referenceID);
                    if (chObj.edges[0].node.endDate != pbObj[i].endAt) {
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
                name: `${j+1}) ${pbObj[i].tasks[j].type == 'UPGRADE' ? ':unlock:: ' : ''}${pbObj[i].tasks[j].title}` 
                    + `${pbObj[i].tasks[j].type == 'POINTS' ? ' (' + pbObj[i].tasks[j].rewardPoints + ' YDS)' : ''}`
                    + `${pbObj[i].tasks[j].category == 'BURN_MOMENT' ? ' :fire:' : ''}`, 
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

        // Print number of total yards available
        embed.addFields( {
            name: `Total yards available: ${totalYdsAvailable}`,
            value: '\u200b'
        })

        // Rewards part
        embed.addFields( {
            name: `Playbook Rewards:`,
            value: '\u200b'
        })
        for (let j = 0; j < pbObj[i].levels.length; j++) {
            for (let k = 0; k < pbObj[i].levels[j].rewards.length; k++) {
                // Excluding useless rewards
                if (pbObj[i].levels[j].rewards[k].title.includes('Banner') || pbObj[i].levels[j].rewards[k].title.includes('Trophy')) continue;

                let prefix;
                switch (pbObj[i].levels[j].rewards[k].tier) {
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
                    name: `${prefix}${pbObj[i].levels[j].rewards[k].title}`,
                    value: `@${pbObj[i].levels[j].requiredPoints} YDS`,
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



