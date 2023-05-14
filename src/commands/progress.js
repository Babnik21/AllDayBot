import { SlashCommandBuilder } from "discord.js";

export const progressCommand = new SlashCommandBuilder()
    .setName('progress')
    .setDescription('Displays user progress towards selected playbook completion')
    .addIntegerOption((option) => {
        return option
        .setName('id')
        .setDescription('Playbook ID (use /playbook to see all playbook\'s IDs)')
        .setRequired(true)
        .setMinValue(1)
    })
    .toJSON();