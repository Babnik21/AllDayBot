import { SlashCommandBuilder } from "discord.js";

export const playbookCommand = new SlashCommandBuilder()
    .setName('playbook')
    .setDescription('Displays all available playbooks')
    .addStringOption((option) => {
        return option.setName('detail')
        .setDescription('Level of deatil for playbooks')
        .addChoices({ name: 'Short', value: 'Short'}, { name: 'Full', value: 'Full' })
        .setRequired(true)
    })
    .toJSON();