import { SlashCommandBuilder } from "discord.js";

export const helloCommand = new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Greet a member')
    .addUserOption((option) => {
        return option.setName('user')
        .setDescription('user')
    })
    .toJSON();

