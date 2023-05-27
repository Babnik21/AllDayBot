import { readFileSync } from "fs";
import { EmbedBuilder } from "@discordjs/builders";

export const gainers = async (discordId, interval) => {
    let data = readFileSync('src/resources/users.json');
    let usersObj = JSON.parse(data);
    let usernameAD = usersObj[discordId].tsUsername;

    let res = await fetch(`https://www.otmnft.com/api/nflallday/collection/moments?limit=500&page=1&sortby=-${interval}&user=${usernameAD}`);
    let resObj = await res.json();

    if (resObj.hasOwnProperty('detail')) {
        console.log('Error fetching collection data!');
        return;
    }

    // Calculate absolute change
    const change = (obj) => {
        return Math.round((obj.price - obj.price * 100 / (obj[interval] + 100)));
    }

    let moments = resObj.data;
    let sortedMoments = moments.sort((a, b) => change(b) - change(a));

    let embed = new EmbedBuilder()
        .setTitle(`**Gainers - ${usernameAD}** <t:${Math.floor(Date.now()/1000)}:t>`)
        .setColor(0x72bf6a);

    for (let i = 0; i < Math.min(sortedMoments.length, 5); i++) {
        if (change(sortedMoments[i]) <= 0) {
            break;
        }
        embed.addFields({ 
            name: `${i+1}) **${sortedMoments[i].playerName}** ${sortedMoments[i].setName} #${sortedMoments[i].serial}/${sortedMoments[i].circulationCount}:`,
            value: `**+$${change(sortedMoments[i])}** (Lowest Ask: $${sortedMoments[i].price}). View moment [here](${sortedMoments[i].link} 'Test hovertext')`
        })
    }

    return [embed];
}
