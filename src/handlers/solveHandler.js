import { getFlowAddress } from "../functions/utils/getFlowAddress.js";
import { solveChallenge } from "../functions/solveChallenge.js";

export const handleSolve = async (interaction) => {
    interaction.deferReply();
    const pbId = interaction.options.get('playbook-id').value;
    const chId = interaction.options.get('challenge-id').value;
    const flowAddress = getFlowAddress(interaction.user.id);
    let embeds = await solveChallenge(pbId - 1, chId - 1, flowAddress);
    interaction.editReply({ embeds: embeds });
}