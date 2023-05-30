import { logger } from "../logger.js"

export const handleAddRole = async (interaction) => {
    let role = interaction.options.getRole('role');
    let userId = interaction.user.id;
    let member = await interaction.guild.members.fetch(userId);
    if (member.roles.cache.has(role.id)) {
        interaction.reply('You already have this role!');
    }
    else {
        try {
            await interaction.guild.members.cache.get(userId).roles.add(role);
            interaction.reply('Successfully assigned role!');
        }
        catch (err) {
            logger.info('Handled the following error:');
            logger.error(err);
            interaction.reply('Unknown error occurred.');
        }
    }
}