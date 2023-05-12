import { Client, GatewayIntentBits, Routes } from "discord.js";
import { config } from "dotenv";
import { REST } from '@discordjs/rest';
import { helloCommand } from './commands/hello.js';
import { playbookCommand } from "./commands/playbook.js";
import { playbooks } from "./functions/fetchPlaybooks.js";

// dotenv
config();
const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.BOT_CLIENT_ID;
const CHANNEL_ID_AD = process.env.CHANNEL_ID_AD.toString();

const rest = new REST({ version: '10' }).setToken(TOKEN)

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
]});

//client.login(TOKEN);
client.on('ready', () => console.log(`${client.user.username} has logged in!`));
client.on('messageCreate', (message) => console.log(message.content));

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'hello') {
            interaction.reply(`Hello <@${interaction.options.get('user').value}>`);
        }
        else if (interaction.commandName === 'playbook') {
            let msgs = await playbooks('Short');
            interaction.reply('Printing out content...');
            for (let i = 0; i < msgs.length; i++) {
                client.channels.cache.get(CHANNEL_ID_AD).send(msgs[i]);
            }
        }
    }
});


async function main() {

    const commands = [
        helloCommand,
        playbookCommand
    ]

    try {
        console.log('Started refreshing bot\'s (/) commands...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands, 
        });
        client.login(TOKEN);
    }
    catch (err) {
        console.log(err);
    }
}

main();
