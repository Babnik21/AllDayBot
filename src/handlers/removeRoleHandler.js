import { logger } from "../logger.js"

export const handleRemoveRole = async (interaction) => {
    let role = interaction.options.getRole('role');
    let userId = interaction.user.id;
    let member = await interaction.guild.members.fetch(userId);
    if (!member.roles.cache.has(role.id)) {
        interaction.reply('You don\'t have this role!');
    }
    else {
        try {
            await interaction.guild.members.cache.get(userId).roles.remove(role);
            interaction.reply('Successfully removed role!');
        }
        catch (err) {
            logger.info('Handled the following error:');
            logger.error(err);
            interaction.reply('Unknown error occurred.');
        }
    }
}