import { SlashCommandBuilder } from "discord.js";

export const removeRoleCommand = new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Get roles. To see all role descriptions, type `/help roles`')
    .addRoleOption(option => {
        return option.setName('role')
        .setDescription('Select this role')
        .setRequired(true)
    })
    .toJSON();