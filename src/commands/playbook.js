import { SlashCommandBuilder } from "discord.js";

export const playbookCommand = new SlashCommandBuilder()
    .setName('playbook')
    .setDescription('Displays all available playbooks')
    .toJSON();