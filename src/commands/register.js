import { SlashCommandBuilder } from "discord.js";

export const registerCommand = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Enter your OTM username to be able to use All Day commands')
    .addStringOption((option) => {
        return option.setName('username')
        .setDescription('Your OTM username')
        .setRequired(true)
    })
    .toJSON();

