import { SlashCommandBuilder } from "discord.js";

export const gainersCommand = new SlashCommandBuilder()
    .setName('gainers')
    .setDescription('Displays moments with biggest price change over selected time interval')
    .addStringOption((option) => {
        return option
        .setName('interval')
        .setDescription('Select time interval for measuring price change')
        .setRequired(true)
        .addChoices(
            { name: '4 hours', value: 'change4' },
            { name: '24 hours', value: 'change24' },
            { name: '7 days', value: 'change7d'}
        )
    })
    .toJSON();