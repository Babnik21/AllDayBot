import { SlashCommandBuilder } from "discord.js";

export const killCommand = new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Force stop the bot')
    .toJSON();