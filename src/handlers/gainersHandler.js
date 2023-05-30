import { gainers } from "../functions/gainers.js";

export const handleGainers = async (interaction) => {
    interaction.deferReply()
    let interval = interaction.options.get('interval').value;
    let embeds = await gainers(interaction.user.id, interval);
    interaction.editReply({ embeds: embeds });
}