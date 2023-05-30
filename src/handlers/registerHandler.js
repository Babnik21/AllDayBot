import { registerUser } from "../functions/registerUser.js";

export const handleRegister = async (interaction) => {
    const username = interaction.options.get('username').value;
    let msg = await registerUser(interaction.user.id, username);
    interaction.reply(msg);
}