import { progressEmbeds } from "../functions/progressEmbeds.js";
import { getFlowAddress } from "../functions/utils/getFlowAddress.js";

export const handleProgress = async (interaction) => {
    interaction.deferReply();
    const pbId = interaction.options.get('id').value;
    const flowAddress = getFlowAddress(interaction.user.id);
    let embeds = await progressEmbeds(pbId - 1, flowAddress);
    interaction.editReply({ embeds: embeds });
}