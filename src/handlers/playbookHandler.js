import { playbooksEmbeds } from "../functions/playbooksEmbeds.js";
import { fetchPlaybooks } from "../functions/utils/fetchPlaybooks.js";

export const handlePlaybook = async (interaction) => {
    interaction.deferReply();
    let pbObj = await fetchPlaybooks();
    let embeds = await playbooksEmbeds(pbObj);
    interaction.editReply( { embeds: embeds });
    return;
}