import { SlashCommandBuilder } from "discord.js";

export const solveChallengeCommand = new SlashCommandBuilder()
    .setName('solve')
    .setDescription('Finds cheapest solution for selected challenge based on user\'s collection')
    .addIntegerOption((option) => {
        return option
        .setName('playbook-id')
        .setDescription('Playbook ID (use /playbook to see all playbook\'s IDs)')
        .setRequired(true)
        .setMinValue(1)
    })
    .addIntegerOption((option) => {
        return option
        .setName('challenge-id')
        .setDescription('Challenge ID (use /playbook to see all playbook\'s Challenge IDs)')
        .setRequired(true)
        .setMinValue(1)
    })
    .toJSON();