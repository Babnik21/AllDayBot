import { SlashCommandBuilder } from "discord.js";

export const helloCommand = new SlashCommandBuilder()
    .setName('hello')
    .setDescription('say hello!')
    .toJSON();

